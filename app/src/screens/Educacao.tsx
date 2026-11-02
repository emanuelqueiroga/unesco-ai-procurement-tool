import { LeituraSimples, AtalhoLeituraSimples } from './LeituraSimples';
import { progressoFrente } from '../percurso/frentes';
import { GrupoFormulario } from './GrupoFormulario';
import { useResumoPlano } from './ResumoContexto';
import { AcoesPercurso } from './AcoesPercurso';
import { ProgressoPergunta } from './ProgressoPergunta';
import { useEffect, useState, type ReactNode } from "react";
import {
  useCaso,
  telasAtivas,
  telasDoCapitulo,
  telaRespondida,
  faltamDe,
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
  telaEdLegada,
  TITULOS_ED,
  E,
  errosEd,
  type CampoEd,
} from "../percurso/pedagogico";
import { orcamentoGovernanca, moedaGovernanca, valorItemOrcamento } from "../percurso/governanca";
import { LinhaEstimativa, CampoQuantidade, UsarEstimativas, semValorComEstimativa, TotaisOrcamentoView, kpisOrcamento } from "./EstimativaReferencia";
import { linhasTotais } from "../percurso/estimativasOrcamento";
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
      <details className="pc-gov-detalhes">
        <summary>
          {t("Adicionar mais informações +")}
          {v.detalhe ? " · " + t("Informações adicionadas") : ""}
        </summary>
        <TextField
          label={t("Informações adicionais: {campo}", { campo: t(f.label) })}
          multiline
          value={String(v.detalhe || "")}
          onChange={(detalhe) => salvar({ ...v, detalhe })}
        />
      </details>
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
          <div className="pc-lit-campos" key="geral">
            {fs
              .filter((f) => !f.grupo)
              .map((f,j) => (
                <GrupoFormulario key={f.caminho} titulo={t(f.label)} estado={t(campoEdRespondido(s,f)?"Preenchido":"A preencher")} abrir={j===0} nome="educacao-grupos"><Campo s={s} f={f} tentou={tentou} ocultarTitulo/></GrupoFormulario>
              ))}
          </div>
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
function Orcamento({ s, tentou }: { s: CasoStore; tentou: boolean }) {
  const o = orcamentoEd(s),
    disponiveis = semValorComEstimativa(o.itens, (i) => i.emReferencia),
    atual = lerEd(s, "orcamento") || {},
    refs = {
      governanca: orcamentoGovernanca(s).itens,
      letramento: orcamentoLetramento(s).itens,
    };
  return (
    <div className="pc-lit-orcamento">
      <p className="pc-nota">
        {t("Moeda")}: {o.moeda}.{" "}
        {t(
          E(
            "Informe cada recurso uma única vez, mesmo quando ele atende a vários temas.",
            "Enter each resource once, even when it serves several themes.",
          ),
        )}
      </p>
      {o.itens.map((i, n) => {
        const p = "orcamento.itens." + i.id,
          v = lerEd(s, p) || {},
          salvar = (item: any) => {
            gravar(s, "orcamento.moeda", o.moeda);
            gravar(s, p, item);
          },
          extra = i.id.startsWith("adicional-");
        return (
          <div id={ident(p)} key={i.id} tabIndex={-1}>
            <GrupoEd
              nome={t(i.nome)}
              recolhivel
              aberto={n === 0 || extra}
              estado={
                i.compartilhado
                  ? t(E("Custo compartilhado", "Shared cost"))
                  : i.valor !== null || i.emReferencia
                    ? valorItemOrcamento(
                        { ...i, referencia: i.emReferencia },
                        o.moeda,
                      )
                    : i.situacao === "a_estimar"
                      ? t("Custo ainda a levantar")
                      : t("Não informado")
              }
            >
              {extra ? (
                <div className="pc-lit-campo">
                  <h3 className="pc-lit-campo-titulo">
                    {t(
                      E(
                        "Tipo de recurso adicional",
                        "Additional resource type",
                      ),
                    )}
                  </h3>
                  <OptionCardGroup
                    className="pc-lit-opcoes"
                    label={t(
                      E(
                        "Tipo de recurso adicional",
                        "Additional resource type",
                      ),
                    )}
                  >
                    {[
                      [
                        "deslocamento",
                        E("Deslocamento e encontros", "Travel and meetings"),
                      ],
                      [
                        "assessoria",
                        E("Assessoria especializada", "Specialist advice"),
                      ],
                      [
                        "pesquisa",
                        E("Pesquisa e avaliação", "Research and evaluation"),
                      ],
                      [
                        "apoio",
                        E("Apoio à participação", "Participation support"),
                      ],
                      ["outro", E("Outro recurso", "Other resource")],
                    ].map(([id, label]) => (
                      <OptionCard
                        key={id}
                        name={i.id + ".nome"}
                        value={id}
                        label={t(label)}
                        checked={atual.adicionais?.[i.id]?.nome === label}
                        onChange={() =>
                          gravar(
                            s,
                            "orcamento.adicionais." + i.id + ".nome",
                            label,
                          )
                        }
                      />
                    ))}
                  </OptionCardGroup>
                </div>
              ) : null}
              <OptionCardGroup
                invalid={tentou&&!i.respondido} describedBy={tentou&&!i.respondido?ident(p)+"-erro":undefined}
                className="pc-lit-opcoes"
                label={t("Situação do custo") + ": " + t(i.nome)}
              >
                {[
                  ["a_estimar", "Custo ainda a levantar"],
                  ["sem_custo", "Sem custo neste orçamento"],
                  ["informado", "Já tenho um valor"],
                  ...(s.ctx.prioridades?.includes("governar")
                    ? [
                        [
                          "governanca",
                          E(
                            "Já custeado na governança",
                            "Already funded under governance",
                          ),
                        ],
                      ]
                    : []),
                  ...(s.ctx.prioridades?.includes("sobre")
                    ? [
                        [
                          "letramento",
                          E(
                            "Já custeado no letramento",
                            "Already funded under AI literacy",
                          ),
                        ],
                      ]
                    : []),
                ].map(([id, label]) => (
                  <OptionCard
                    key={id}
                    name={p}
                    value={id}
                    label={t(label)}
                    checked={v.situacao === id}
                    onChange={(id) => salvar({ ...v, situacao: id })}
                  />
                ))}
              </OptionCardGroup>
              {v.situacao === "informado" ? (
                <div className="pc-lit-campo">
                  <CampoNumero
                    label={t("Valor informado") + " (" + o.moeda + ")"}
                    value={v.valor ?? ""}
                    decimais
                    error={
                      tentou && !i.respondido
                        ? t("Informe um valor maior ou igual a zero.")
                        : undefined
                    }
                    onChange={(valor) => salvar({ ...v, valor })}
                  />
                </div>
              ) : null}
              {i.compartilhado ? (
                <OptionCardGroup
                  className="pc-lit-opcoes"
                  label={t(E("Item de origem do custo", "Source cost item"))}
                >
                  {refs[v.situacao as keyof typeof refs].map((ref) => (
                    <OptionCard
                      key={ref.id}
                      name={p + ".referencia"}
                      value={ref.id}
                      label={ref.nome}
                      checked={v.referencia === ref.id}
                      onChange={(referencia) => salvar({ ...v, referencia })}
                    />
                  ))}
                </OptionCardGroup>
              ) : null}
              {i.id === "equipe" ? (
                <CampoQuantidade
                  id={ident("orcamento.quantidades.equipeFte")}
                  label={t("Pessoas na equipe (equivalente em tempo integral)")}
                  decimais
                  value={lerEd(s, "orcamento.quantidades.equipeFte")}
                  onChange={(valor) =>
                    gravar(s, "orcamento.quantidades.equipeFte", valor)
                  }
                />
              ) : null}
              {i.id === "formacao" ? (
                <>
                  <CampoQuantidade
                    id={ident("orcamento.quantidades.profissionais")}
                    label={t("Profissionais a formar")}
                    value={lerEd(s, "orcamento.quantidades.profissionais")}
                    onChange={(valor) =>
                      gravar(s, "orcamento.quantidades.profissionais", valor)
                    }
                  />
                  <CampoQuantidade
                    id={ident("orcamento.quantidades.horasProfissional")}
                    label={t("Horas por profissional")}
                    decimais
                    value={lerEd(s, "orcamento.quantidades.horasProfissional")}
                    onChange={(valor) =>
                      gravar(
                        s,
                        "orcamento.quantidades.horasProfissional",
                        valor,
                      )
                    }
                  />
                </>
              ) : null}
              {!i.compartilhado ? (
                <LinhaEstimativa
                  s={s}
                  est={i.estimativa}
                  tela="ed-recursos"
                  nome={t(i.nome)}
                  emUso={i.emReferencia}
                  onUsar={() => salvar({ ...v, situacao: "referencia" })}
                />
              ) : null}
              {tentou && !i.respondido ? (
                <p id={ident(p)+"-erro"} className="pc-lit-erro">
                  {t(
                    "Informe a situação e, quando necessário, o valor ou o item de origem.",
                  )}
                </p>
              ) : null}
              <div className="pc-lit-campo">
                <details className="pc-gov-detalhes">
                  <summary>{t("Adicionar mais informações +")}</summary>
                  <TextField
                    label={t("Detalhamento e fonte do item")}
                    multiline
                    value={String(v.detalhe || "")}
                    onChange={(detalhe) => salvar({ ...v, detalhe })}
                  />
                </details>
              </div>
              {extra ? (
                <Button
                  variant="link"
                  onClick={() => {
                    const { [i.id]: _a, ...adicionais } =
                        atual.adicionais || {},
                      { [i.id]: _b, ...itens } = atual.itens || {};
                    gravar(s, "orcamento.adicionais", adicionais);
                    gravar(s, "orcamento.itens", itens);
                  }}
                >
                  {t("Remover")}
                </Button>
              ) : null}
            </GrupoEd>
          </div>
        );
      })}
      <UsarEstimativas
        quantos={disponiveis.length}
        onUsar={() => {
          gravar(s, "orcamento.moeda", o.moeda);
          for (const i of disponiveis)
            gravar(s, "orcamento.itens." + i.id, {
              ...(lerEd(useCaso.getState(), "orcamento.itens." + i.id) || {}),
              situacao: "referencia",
            });
        }}
      />
      <Button
        variant="secondary"
        onClick={() => {
          const seq = (atual.seq || 0) + 1;
          gravar(s, "orcamento.seq", seq);
          gravar(s, "orcamento.adicionais.adicional-" + seq, { nome: "" });
          requestAnimationFrame(() =>
            focarPendencia(ident("orcamento.itens.adicional-" + seq)),
          );
        }}
      >
        {t("Adicionar recurso")}
      </Button>
      <Resumo s={s} />
    </div>
  );
}
export function PainelEducacao({ s }: { s: CasoStore }) {
  const p = planoEd(s),
    o = p.orcamento,
    qs = telasAtivas(s),
    faltam = faltamDe(s),
    proxima = faltam[0],
    gaveta = useMediaQuery("(max-width: 1439px)"),
    {aberta,setAberta,integrado}=useResumoPlano();
  const feitas=progressoFrente(s,"educacao");
  const progresso = t("{n} de {total} telas desta frente preenchidas", {
    n: feitas.feitas,
    total: feitas.total,
  });
  const panel = (
    <PlanPanel
      className="pc-lit-painel pc-est-painel"
      fluid
      paperOnly={gaveta}
      title={p.pais || p.titulo}
      kicker={p.titulo}
      facts={progresso}
      state={faltam.length || p.pendentes ? "writing" : "complete"}
      openHref={href.plano()}
      summaryTitle={t("Em resumo")}
      originLine={
        <>
          <p>{p.proxima}</p>
          <p>{p.escopo}</p>
        </>
      }
      kpis={kpisOrcamento("ed-orcamento", o)}
      recommendationsTitle={t(E("Temas do plano", "Plan themes"))}
      recommendationsCount={p.temas.length}
      recommendations={p.temas
        .slice(0, 3)
        .map((q) => ({ id: q.id, text: t(q.nome) }))}
      footer={
        <>
          {proxima ? (
            <Button
              size="sm"
              href={href.pergunta(proxima.capitulo, proxima.id)}
            >
              {t("Continuar de onde parei")}
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" href={href.plano()}>
            {t("Resumo desta frente")}
          </Button>
        </>
      }
    />
  );
  return gaveta ? (
    <PlanDrawer
      hideTrigger={integrado}
      open={aberta}
      onOpenChange={setAberta}
      zoneLabel={p.titulo}
      summary={progresso}
      openLabel={t("Abrir o seu plano")}
      closeLabel={t("Fechar")}
    >
      <div className="pc-est-painel">{panel}</div>
    </PlanDrawer>
  ) : (
    <aside className="pc-plano" aria-label={p.titulo}>
      {panel}
    </aside>
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
  const fallback: Record<string, string> = {
      "ed-tecnologia": "ed-intervencao",
      "ed-teste": "ed-avaliacao",
      "ed-digital": "ed-intervencao",
    },
    alternativa = qs.find((q) => q.id === fallback[idLegado]);
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
          kicker={<ProgressoPergunta s={s} n={n} id={id}/>}
          title={t(TITULOS_ED[id] || TITULO_TELA[id] || CURTO[id] || id)}
          explanation={t(
            id === "ed-objetivos"
              ? E(
                  "Os impactos vêm dos desafios escolhidos. Revise os objetivos e informe a meta.",
                  "Impacts follow the selected challenges. Review objectives and enter the target.",
                )
              : id === "ed-execucao"
                ? E(
                    "Conte cada participante uma única vez, mesmo quando participa de vários temas.",
                    "Count each participant once, even when they take part in several themes.",
                  )
                : LEAD[id] || "",
          )}
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
              <Campos s={s} id={id} tentou={tentou} />
              {id === "ed-recursos" ? (
                <Orcamento s={s} tentou={tentou} />
              ) : null}
            </div>
          ) : (
            <ControlesTela e={s} tela={ativa} />
          )}
        </QuestionFrame>
      </div>
    </Shell>
  );
}
