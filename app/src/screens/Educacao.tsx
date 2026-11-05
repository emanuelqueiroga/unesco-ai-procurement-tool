import { LeituraSimples, AtalhoLeituraSimples } from './LeituraSimples';
import { usePadroes } from "./usePadroes";
import { FasesV16, OrcamentoV16 } from "./OrcamentoV16";
import { ehSugerido } from "../percurso/padroesTeste";
import { progressoFrente } from '../percurso/frentes';
import { GrupoFormulario } from './GrupoFormulario';
import { AcoesPercurso } from './AcoesPercurso';
import { Fragment, useEffect, useState, type ReactNode } from "react";
import {
  useCaso,
  telasAtivas,
  telasDoCapitulo,
  telaRespondida,
  faltamDe,
  TELAS_FORA_DO_FLUXO,
  type CasoStore,
  type Capitulo,
} from "../store";
import {
  Button,
  OptionCard,
  OptionCardGroup,
  TextField,
  QuestionFrame,
  Alert,
  PlanPanel,
  PlanDrawer,
  useMediaQuery,
} from "../ui";
import { LOC } from "../domain";
import { Shell } from "./Shell";
import { ControlesTela } from "../percurso/Controles";
import { CampoNumero } from "../percurso/CampoNumero";
import {
  impactosPedagogicos,
  alterarEd,
  camposEd,
  campoEdRespondido,
  valorEd,
  idsEd,
  lerEd,
  temasEd,
  orcamentoEd,
  planoEd,
  usuariosSugeridosEd,
  usaIAEd,
  telaEdLegada,
  TITULOS_ED,
  E,
  errosEd,
  type CampoEd,
} from "../percurso/pedagogico";
import { orcamentoGovernanca, moedaGovernanca, valorItemOrcamento } from "../percurso/governanca";
import { CampoQuantidade, semValorComEstimativa, TotaisOrcamentoView } from "./EstimativaReferencia";
import { linhasTotais, mesesPeriodo } from "../percurso/estimativasOrcamento";
import { TabelaRecursos, resumoPeriodo, type LinhaRecurso } from "./TabelaRecursos";
import { primeiraFrase } from "../percurso/textos";
import { orcamentoLetramento, alterarLit } from "../percurso/letramento";
import { selecionarLit } from "../percurso/letramentoInterface";
import {
  entradaEtapa,
  vizinhos,
  focarPendencia,
} from "../percurso/navegacaoOrientada";
import { t, infoCapitulo, CURTO, TITULO_TELA, LEAD } from "../percurso/textos";
import { href, ir, type Rota } from "../percurso/rota";
import "./governanca.css";
import "./letramento.css";
import "./orientado.css";
const ident = (p: string) => "ed-" + p.replace(/[^a-zA-Z0-9_-]/g, "-");
const gravar = (s: CasoStore, p: string, v: any) =>
  s.responder("educacao", alterarEd(useCaso.getState(), p, v));
function GrupoEd({
  nome,
  children,
  recolhivel = false,
  aberto = false,
  estado,
}: {
  nome: string;
  children: ReactNode;
  recolhivel?: boolean;
  aberto?: boolean;
  estado?: string;
}) {
  return <GrupoFormulario titulo={nome} estado={estado} abrir={aberto} nome="educacao-grupos">{children}</GrupoFormulario>;
}

function Campo({
  s,
  f,
  tentou,
  ocultarTitulo=false,
}: {
  s: CasoStore;
  f: CampoEd;
  tentou: boolean;
  ocultarTitulo?:boolean;
}) {
  const Titulo = f.grupo ? "h3" : "h2";
  const v = lerEd(s, f.caminho) || {},
    ids = idsEd(s, f.caminho),
    falta = tentou && !campoEdRespondido(s, f),
    salvar = (novo: any) => gravar(s, f.caminho, novo);
  return (
    <section
      id={ident(f.caminho)}
      className={"pc-lit-campo" + (f.numero ? " pc-lit-campo--numero" : "") + (ocultarTitulo&&f.numero?" pc-ux-rotulo-externo":"")}
      tabIndex={-1}
    >
      {f.numero ? (
        <>
          <CampoNumero
            label={t(f.label)}
            value={v.situacao === "a_levantar" ? "" : (v.valor ?? "")}
            disabled={v.situacao === "a_levantar"}
            decimais={f.decimal}
            error={
              falta
                ? t(
                    E(
                      "Informe um valor válido ou marque a informação a levantar.",
                      "Enter a valid value or mark the information to gather.",
                    ),
                  )
                : undefined
            }
            onChange={(valor) => salvar({ ...v, valor, situacao: "informado" })}
          />
          <label className="pc-lit-pendente">
            <input
              type="checkbox"
              checked={v.situacao === "a_levantar"}
              onChange={(e) =>
                salvar({
                  ...v,
                  situacao: e.target.checked ? "a_levantar" : "informado",
                })
              }
            />
            {t("Informação a levantar")}
          </label>
        </>
      ) : (
        <>
          {!ocultarTitulo?<Titulo className="pc-lit-campo-titulo">{t(f.label)}</Titulo>:null}
          <OptionCardGroup
            invalid={falta} describedBy={falta?ident(f.caminho)+'-erro':undefined}
            className="pc-lit-opcoes"
            label={t(f.label)}
            type={f.multipla ? "checkbox" : "radio"}
          >
            {f.opcoes?.map((o) => (
              <OptionCard
                key={o.id}
                type={f.multipla ? "checkbox" : "radio"}
                name={f.caminho}
                value={o.id}
                label={t(o.texto)}
                checked={ids.includes(o.id)}
                onChange={(id, on) =>
                  salvar({
                    ...v,
                    escolhas: selecionarLit(ids, id, on, f.multipla),
                  })
                }
              />
            ))}
          </OptionCardGroup>
          {falta ? (
            <p id={ident(f.caminho)+'-erro'} className="pc-lit-erro">
              {t("Selecione uma opção ou indique a informação a levantar.")}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
function Campos({
  s,
  id,
  tentou,
}: {
  s: CasoStore;
  id: string;
  tentou: boolean;
}) {
  const fs = camposEd(s).filter((f) => f.tela === id),
    grupos = [...new Set(fs.map((f) => f.grupo))];
  return (
    <div className="pc-lit-campos">
      {grupos.map((g, i) =>
        g ? (
          <GrupoEd
            key={g}
            nome={t(g)}
            recolhivel={grupos.length > 1}
            aberto={i === 0}
          >
            {fs
              .filter((f) => f.grupo === g)
              .map((f) => (
                <Campo key={f.caminho} s={s} f={f} tentou={tentou} />
              ))}
          </GrupoEd>
        ) : (
          <Fragment key="geral">
            {fs
              .filter((f) => !f.grupo)
              .map((f,j) => (
                <Campo key={f.caminho} s={s} f={f} tentou={tentou} />
              ))}
          </Fragment>
        ),
      )}
    </div>
  );
}
function Resumo({ s }: { s: CasoStore }) {
  const o = orcamentoEd(s);
  return (
    <TotaisOrcamentoView
      linhas={linhasTotais(o)}
      nota={
        o.faltam
          ? t(
              "{n} itens sem valor informado. O subtotal não é o orçamento completo.",
              { n: o.faltam },
            )
          : o.estimados
            ? t(
                "Estimativas de referência são ilustrativas: confirme os valores antes de aprovar o orçamento.",
              )
            : undefined
      }
    />
  );
}
/** Quantidades opcionais das telas Intervenção (profissionais e horas) e Uso de IA (usuários, sugerido pelo Contexto). */
function QuantidadesEd({ s, id }: { s: CasoStore; id: string }) {
  const q = (c: string) => "orcamento.quantidades." + c;
  const campo = (c: string, label: string, decimais = false, valor?: unknown) => (
    <CampoQuantidade key={c} id={ident(q(c))} label={t(label)} decimais={decimais} dica={false} value={valor ?? lerEd(s, q(c))} onChange={(v) => gravar(s, q(c), v)}
      sugerido={c === "usuarios" ? !lerEd(s, q(c)) && valor != null : ehSugerido(s, "educacao", q(c))} />
  );
  if (id === "ed-intervencao") return <><div className="pc-curto-numeros">{campo("profissionais", "Profissionais a formar")}{campo("horasProfissional", "Horas por profissional", true)}</div>
    {usaIAEd(s) ? <div className="pc-curto-numeros">{campo("usuarios", E("Usuários da ferramenta", "Tool users"), false, lerEd(s, q("usuarios")) ?? usuariosSugeridosEd(s) ?? undefined)}</div> : null}</>;
  if (id === "ed-tecnologia") return <div className="pc-curto-numeros">{campo("usuarios", E("Usuários da ferramenta", "Tool users"), false, lerEd(s, q("usuarios")) ?? usuariosSugeridosEd(s) ?? undefined)}</div>;
  return null;
}
function Orcamento({ s, tentou }: { s: CasoStore; tentou: boolean }) {
  const o = orcamentoEd(s),
    disponiveis = semValorComEstimativa(o.itens, (i) => i.emReferencia),
    atual = lerEd(s, "orcamento") || {},
    gov = orcamentoGovernanca(s),
    lit = orcamentoLetramento(s),
    refs = { governanca: gov.itens, letramento: lit.itens },
    moedaRef = { governanca: gov.moeda, letramento: lit.moeda },
    frenteRef = { governanca: t("governança"), letramento: t("letramento") };
  const extrasSit = [
    ...(s.ctx.prioridades?.includes("governar") ? [{ id: "governanca", rotulo: "Custeado na governança" }] : []),
    ...(s.ctx.prioridades?.includes("sobre") ? [{ id: "letramento", rotulo: "Custeado no letramento" }] : []),
  ];
  const campo = (c: string) => camposEd(s).find((f) => f.caminho === c);
  const valorDe = (c: string) => { const f = campo(c); return f && campoEdRespondido(s, f) ? valorEd(s, f) : ""; };
  const linhas: LinhaRecurso[] = o.itens.map((i) => {
    const p = "orcamento.itens." + i.id,
      v = lerEd(s, p) || {},
      salvar = (item: any) => { gravar(s, "orcamento.moeda", o.moeda); gravar(s, p, item); },
      novo = (mudar: any) => salvar({ ...(lerEd(useCaso.getState(), p) || {}), ...mudar }),
      extra = i.id.startsWith("adicional-"),
      chave = v.situacao as "governanca" | "letramento",
      origem = i.compartilhado ? refs[chave]?.find((r: any) => r.id === v.referencia) : undefined;
    return {
      id: i.id, ancora: ident(p), nome: t(i.nome), situacao: String(v.situacao || ""), valor: v.valor,
      estimativa: i.estimativa, emUso: i.emReferencia, respondido: i.respondido,
      compartilhado: i.compartilhado ? { frente: frenteRef[chave], valor: origem ? valorItemOrcamento(origem as any, moedaRef[chave]) : t("Não informado") } : null,
      extras: extrasSit,
      topo: extra ? (
        <div className="pc-lit-campo">
          <OptionCardGroup className="pc-lit-opcoes" label={t(E("Tipo de recurso adicional", "Additional resource type"))}>
            {[
              ["deslocamento", E("Deslocamento e encontros", "Travel and meetings")],
              ["assessoria", E("Assessoria especializada", "Specialist advice")],
              ["pesquisa", E("Pesquisa e avaliação", "Research and evaluation")],
              ["apoio", E("Apoio à participação", "Participation support")],
              ["outro", E("Outro recurso", "Other resource")],
            ].map(([id, label]) => (
              <OptionCard key={id} name={i.id + ".nome"} value={id} label={t(label)} checked={atual.adicionais?.[i.id]?.nome === label}
                onChange={() => gravar(s, "orcamento.adicionais." + i.id + ".nome", label)} />
            ))}
          </OptionCardGroup>
        </div>
      ) : undefined,
      origem: i.compartilhado ? (
        <OptionCardGroup className="pc-lit-opcoes" label={t(E("Item de origem do custo", "Source cost item"))}>
          {refs[chave].map((ref: any) => (
            <OptionCard key={ref.id} name={p + ".referencia"} value={ref.id} label={ref.nome} checked={v.referencia === ref.id} onChange={(referencia) => novo({ referencia })} />
          ))}
        </OptionCardGroup>
      ) : undefined,
      quantidades: i.id === "equipe" ? (
        <CampoQuantidade id={ident("orcamento.quantidades.equipeFte")} label={t("Pessoas na equipe (equivalente em tempo integral)")} decimais
          value={lerEd(s, "orcamento.quantidades.equipeFte")} onChange={(valor) => gravar(s, "orcamento.quantidades.equipeFte", valor)} sugerido={ehSugerido(s, "educacao", "orcamento.quantidades.equipeFte")} />
      ) : undefined,
      detalhe: String(v.detalhe || ""),
      onSituacao: (situacao) => novo({ situacao }),
      onValor: (valor) => novo({ valor }),
      onDetalhe: (detalhe) => novo({ detalhe }),
      onRemover: extra ? () => {
        const a = lerEd(useCaso.getState(), "orcamento") || {};
        const { [i.id]: _a, ...adicionais } = a.adicionais || {}, { [i.id]: _b, ...itens } = a.itens || {};
        gravar(s, "orcamento.adicionais", adicionais);
        gravar(s, "orcamento.itens", itens);
      } : undefined,
    };
  });
  const camposTela = camposEd(s).filter((f) => f.tela === "ed-recursos");
  return (
    <TabelaRecursos s={s} linhas={linhas} moeda={o.moeda} tela="ed-recursos" tentou={tentou}
      contexto={{ resumo: resumoPeriodo(mesesPeriodo('educacao', s), valorDe("orcamento.periodo"), o.moeda), completo: camposTela.every((f) => campoEdRespondido(s, f)),
      campos: <Campos s={s} id="ed-recursos" tentou={tentou} /> }}
      disponiveis={disponiveis.length}
      onUsarTodas={() => {
        gravar(s, "orcamento.moeda", o.moeda);
        for (const i of disponiveis)
          gravar(s, "orcamento.itens." + i.id, { ...(lerEd(useCaso.getState(), "orcamento.itens." + i.id) || {}), situacao: "referencia" });
      }}
      onAdicionar={() => {
        const seq = ((lerEd(useCaso.getState(), "orcamento") || {}).seq || 0) + 1;
        gravar(s, "orcamento.seq", seq);
        gravar(s, "orcamento.adicionais.adicional-" + seq, { nome: "" });
        requestAnimationFrame(() => focarPendencia(ident("orcamento.itens.adicional-" + seq)));
      }} />
  );
}
function PlanoEd({ s }: { s: CasoStore }) {
  const p = planoEd(s),
    faltam = faltamDe(s),
    [ocupado, setOcupado] = useState(false),
    [erro, setErro] = useState("");
  const baixar = async (tipo: "brief" | "anexo") => {
    setOcupado(true);
    setErro("");
    try {
      const { gerarEducacaoPDF } = await import("../plano/pdf_educacao");
      const doc = await gerarEducacaoPDF(s.estado(), { tipo });
      doc.save(
        tipo === "brief" ? "resumo-educacional.pdf" : "plano-educacional.pdf",
      );
    } catch {
      setErro(t("Não foi possível gerar o PDF."));
    } finally {
      setOcupado(false);
    }
  };
  return (
    <div className="pc-gov-plano">
      <h1>{p.titulo}</h1>
      <p className="pc-lead">{p.pais}</p>
      <Alert kind="info" title={p.proxima}>
        {p.escopo}
      </Alert>
      <Resumo s={s} />
      <div className="pc-botoes">
        <Button disabled={ocupado} onClick={() => void baixar("brief")}>
          {t(E("Resumo educacional (PDF)", "Educational summary (PDF)"))}
        </Button>
        <Button
          disabled={ocupado}
          variant="secondary"
          onClick={() => void baixar("anexo")}
        >
          {t(E("Plano educacional (PDF)", "Educational plan (PDF)"))}
        </Button>
      </div>
      {erro ? <p role="alert">{erro}</p> : null}<AtalhoLeituraSimples/>
      {faltam.length ? (
        <section className="pc-gov-card">
          <h2>{t("Respostas que faltam")}</h2>
          <ul>
            {faltam.map((q) => (
              <li key={q.id}>
                <a href={href.pergunta(q.capitulo, q.id)}>
                  {t(TITULOS_ED[q.id] || CURTO[q.id] || q.id)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {p.blocos.map((b, i) => (
        <section className="pc-gov-card" key={i}>
          <h2>{b.titulo}</h2>
          <dl className="pc-gov-dados">
            {b.linhas.map((l, j) => (
              <div key={j}>
                <dt>{l.rotulo}</dt>
                <dd>{l.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <Button variant="secondary" href={href.pergunta(4, "ed-expansao")}>
        {t("Voltar")}
      </Button>
      <LeituraSimples s={s}/>
    </div>
  );
}
export function Educacao({ rota }: { rota: Rota }) {
  const s = useCaso(),
    [tentou, setTentou] = useState(false),
    qs = telasAtivas(s),
    n: Capitulo = ["abertura", "pergunta", "sintese"].includes(rota.tipo)
      ? (rota as { n: Capitulo }).n
      : 3;
  const ativa =
      rota.tipo === "pergunta" ? qs.find((q) => q.id === rota.tela) : undefined,
    idLegado = rota.tipo === "pergunta" ? telaEdLegada(rota.tela) : "",
    legado = qs.find((q) => q.id === idLegado);
  usePadroes("educacao", rota.tipo === "pergunta" && rota.tela.startsWith("ed-"));
  const fallback: Record<string, string> = { ...TELAS_FORA_DO_FLUXO, "ed-tecnologia": "ed-intervencao" },
    alternativa = qs.find((q) => q.id === TELAS_FORA_DO_FLUXO[idLegado]) || qs.find((q) => q.id === fallback[idLegado]) || qs.find((q) => q.id === TELAS_FORA_DO_FLUXO[rota.tipo === "pergunta" ? rota.tela : ""]);
  const remap =
    rota.tipo === "plano"
      ? null
      : rota.tipo === "refinar"
        ? href.pergunta(3, "ed-recursos")
        : !temasEd(s).length && n > 1
          ? href.pergunta(1, "problemas")
          : rota.tipo === "abertura"
            ? entradaEtapa(s, n)
            : rota.tipo === "sintese"
              ? n < 4
                ? entradaEtapa(s, (n + 1) as Capitulo)
                : href.plano()
              : !ativa
                ? legado
                  ? href.pergunta(legado.capitulo, legado.id)
                  : alternativa
                    ? href.pergunta(alternativa.capitulo, alternativa.id)
                    : entradaEtapa(s, n)
                : null;
  useEffect(() => {
    if (remap) window.location.replace(remap);
  }, [remap]);
  if (remap) return null;
  if (rota.tipo === "plano")
    return (
      <Shell plano={false}>
        <PlanoEd s={s} />
      </Shell>
    );
  if (!ativa) return null;
  const id = ativa.id,
    info = infoCapitulo(n, s),
    dest = vizinhos(s, id),
    pendencias = camposEd(s).filter(
      (f) => f.tela === id && !campoEdRespondido(s, f),
    ),
    custos =
      id === "ed-recursos"
        ? orcamentoEd(s).itens.filter((i) => !i.respondido)
        : [],
    erros = errosEd(s, id),
    falta = !telaRespondida(s, ativa),
    lista = telasDoCapitulo(n, s);
  const itens = [
    ...pendencias.map((f) => ({
      id: ident(f.caminho),
      label: (f.grupo ? t(f.grupo) + " · " : "") + t(f.label),
    })),
    ...custos.map((i) => ({
      id: ident("orcamento.itens." + i.id),
      label: t(i.nome),
    })),
  ];
  const avancar = () => {
    if (!falta) {
      ir(dest.proxima);
      return;
    }
    setTentou(true);
    requestAnimationFrame(() => focarPendencia(itens[0]?.id || "ed-validacao"));
  };
  return (
    <Shell pos={{ capitulo: n, tela: id }} contexto={t(info.titulo)}>
      <div className="pc-pergunta" data-tela={id}>
        <QuestionFrame
          title={t(TITULOS_ED[id] || TITULO_TELA[id] || CURTO[id] || id)}
          explanation={id.startsWith("ed-") ? undefined : t(LEAD[id] || "") || undefined}
          actions={<AcoesPercurso anterior={dest.anterior} avancar={avancar}/>}
        >
          {tentou && falta ? (
            <div
              className="pc-lit-validacao"
              id="ed-validacao"
              role="alert"
              tabIndex={-1}
            >
              <b>
                {t(
                  "Complete as respostas indicadas ou marque as informações a levantar.",
                )}
              </b>
              <ul>
                {itens.slice(0,3).map((p) => (
                  <li key={p.id}>
                    <a
                      href={"#" + p.id}
                      onClick={(e) => {
                        e.preventDefault();
                        focarPendencia(p.id);
                      }}
                    >
                      {p.label}
                    </a>
                  </li>
                ))}
                {erros.map((e) => (
                  <li key={e}>{t(e)}</li>
                ))}
                {!itens.length && !erros.length ? (
                  <li>
                    {t(
                      id === "local"
                        ? "Escolha o país para avançar."
                        : id === "problemas"
                          ? "Selecione os desafios educacionais."
                          : id === "etapas"
                            ? "Selecione as etapas e informe escolas e estudantes."
                            : "Selecione ao menos uma prioridade.",
                    )}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {id.startsWith("ed-") ? (
            <div className="pc-lit-campos">
              {id === "ed-objetivos" ? (
                <section>
                  <h2 className="pc-lit-campo-titulo">
                    {t("Impactos definidos pelos desafios selecionados")}
                  </h2>
                  <ul>
                    {impactosPedagogicos(s).map((i) => (
                      <li key={i.id}>{t(i.texto)}</li>
                    ))}
                  </ul>
                  {s.caso.resultado ? (
                    <details className="pc-gov-detalhes">
                      <summary>
                        {t(
                          E(
                            "Ver a meta salva no percurso anterior",
                            "View the target saved in the previous pathway",
                          ),
                        )}
                      </summary>
                      <p>{String(s.caso.resultado)}</p>
                    </details>
                  ) : null}
                </section>
              ) : null}
              {id === "ed-recursos" ? (
                <OrcamentoV16 s={s} frente="educacao" tentou={tentou} />
              ) : id === "ed-fases" ? (
                <FasesV16 s={s} frente="educacao" />
              ) : (
                <>
                <Campos s={s} id={id} tentou={tentou} />
                <QuantidadesEd s={s} id={id} />
              </>
              )}
            </div>
          ) : (
            <ControlesTela e={s} tela={ativa} />
          )}
        </QuestionFrame>
      </div>
    </Shell>
  );
}
