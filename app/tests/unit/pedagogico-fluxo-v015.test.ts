import { beforeEach, describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  useCaso,
  telasAtivas,
  faltamDe,
  telaRespondida,
  migrar,
} from "../../src/store";
import {
  percursoPedagogico,
  percursoGovernanca,
  percursoLetramento,
  setLang,
} from "../../src/domain";
import {
  alterarEd,
  temasEd,
  camposEd,
  lerEd,
  idsEd,
  valorEd,
  usaIAEd,
  digitalEd,
  testeEd,
  orcamentoEd,
  planoEd,
  campoEdRespondido,
  impactosPedagogicos,
  edRespondido,
  TITULOS_ED,
} from "../../src/percurso/pedagogico";
import { alterarLit } from "../../src/percurso/letramento";
import { entradaEtapa, vizinhos } from "../../src/percurso/navegacaoOrientada";
import { capitulosNav } from "../../src/screens/Shell";
import { destinoContinuar } from "../../src/screens/transversal";
import { href, lerRota } from "../../src/percurso/rota";
import { gerarEducacaoPDF } from "../../src/plano/pdf_educacao";
import {
  desafiosGovernanca,
  pendenciasGov,
  governancaRespondida,
  CUSTOS_GOV,
} from "../../src/percurso/governanca";
import {
  presetGovernanca,
  textoSelecaoGov,
} from "../../src/percurso/governancaPresets";
const S = () => useCaso.getState();
function set(p: string, v: any) {
  S().responder("educacao", alterarEd(S(), p, v));
}
const escolher = (p: string, id: string) =>
  set(p, { ...lerEd(S(), p), escolhas: [id] });
function iniciar(pr = ["com"], ids = ["C11"]) {
  S().escolherPais("BRA");
  S().responder("prioridades", pr);
  S().responder("problemas", ids);
  S().responder("etapas", {
    fund2: { on: true, escolas: 120, alunos: 12000, soTotal: true },
  });
}
function completar() {
  for (const q of telasAtivas(S())) {
    if (!q.id.startsWith("ed-")) continue;
    for (const f of camposEd(S()).filter((f) => f.tela === q.id)) {
      if (f.numero)
        set(f.caminho, {
          valor:
            f.caminho === "execucao.participantes"
              ? 250
              : f.caminho.endsWith(".meta")
                ? 80
                : 12,
          situacao: "informado",
        });
      else if (!idsEd(S(), f.caminho).length)
        escolher(f.caminho, f.opcoes![0].id);
    }
    if (q.id === "ed-recursos")
      for (const i of orcamentoEd(S()).itens)
        set("orcamento.itens." + i.id, { situacao: "sem_custo" });
  }
}
beforeEach(() => {
  setLang("pt");
  S().carregarExemplo("novo");
});
describe("v015: percursos educacionais por intervenção e competências", () => {
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip.each(["com", "para"])(
    "%s tem quatro etapas educacionais e não pressupõe contratação",
    (pr) => {
      iniciar([pr], [pr === "com" ? "C11" : "F2"]);
      expect(percursoPedagogico(S().ctx)).toBe(true);
      expect(capitulosNav(S(), {}).map((x) => x.title)).toEqual([
        "Contexto",
        "Intervenção e avaliação",
        "Execução e recursos",
        "Acompanhamento e expansão",
      ]);
      expect(
        telasAtivas(S()).some((q) =>
          [
            "testes",
            "tarefas",
            "pagamento",
            "linhaBase",
            "alternativa",
            "problema",
          ].includes(q.id),
        ),
      ).toBe(false);
      expect(S().caso.tarefas).toEqual([]);
    },
  );
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("inclui tecnologia e prova de conceito somente quando a intervenção usa IA", () => {
    iniciar();
    escolher("intervencao.tipo", "sem");
    escolher("avaliacao.tipo", "continua");
    expect(usaIAEd(S())).toBe(false);
    expect(digitalEd(S())).toBe(false);
    expect(testeEd(S())).toBe(false);
    expect(
      telasAtivas(S()).some((q) =>
        ["ed-tecnologia", "ed-digital", "ed-teste"].includes(q.id),
      ),
    ).toBe(false);
    escolher("intervencao.tipo", "mista");
    escolher("avaliacao.tipo", "ambos");
    expect(telasAtivas(S()).map((q) => q.id)).toEqual(
      expect.arrayContaining(["ed-tecnologia", "ed-digital", "ed-teste"]),
    );
    escolher("intervencao.tipo", "sem");
    expect(testeEd(S())).toBe(false);
    expect(edRespondido(S(), "ed-avaliacao")).toBe(false);
    expect(lerEd(S(), "avaliacao.tipo").escolhas).toEqual(["ambos"]);
  });
  it("validação pedagógica e recursos digitais podem existir sem IA", () => {
    iniciar();
    escolher("intervencao.tipo", "sem");
    escolher("intervencao.recursos", "digital");
    escolher("avaliacao.tipo", "pedagogica");
    expect(digitalEd(S())).toBe(true);
    expect(testeEd(S())).toBe(true);
    expect(telasAtivas(S()).some((q) => q.id === "ed-tecnologia")).toBe(false);
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("temas equivalentes de duas prioridades não duplicam ações ou metas", () => {
    iniciar(
      ["com", "para"],
      ["C17", "F1", "F8", "C18", "F5", "C20", "F7", "C21", "F2"],
    );
    expect(temasEd(S()).map((q) => q.id)).toEqual([
      "trabalho",
      "tvet",
      "cidadania",
      "competencias",
    ]);
    expect(temasEd(S())[0].desafios).toEqual(["C17", "F1", "F8"]);
    expect(
      camposEd(S()).filter((f) => f.caminho.endsWith(".meta")),
    ).toHaveLength(4);
    expect(
      camposEd(S()).filter((f) => f.caminho === "execucao.participantes"),
    ).toHaveLength(1);
    expect(orcamentoEd(S()).itens).toHaveLength(5);
  });
  it("trocar desafios isola as decisões e o orçamento, mantendo dados para retorno", () => {
    iniciar();
    escolher("intervencao.tipo", "ia");
    set("orcamento.itens.equipe", { situacao: "informado", valor: 1234.56 });
    set("execucao.participantes", { valor: 250, situacao: "informado" });
    S().responder("prioridades", ["para"]);
    S().responder("problemas", ["F3"]);
    expect(idsEd(S(), "intervencao.tipo")).toEqual([]);
    expect(orcamentoEd(S()).informados).toBe(0);
    expect(lerEd(S(), "execucao.participantes")).toBeUndefined();
    S().responder("prioridades", ["com"]);
    S().responder("problemas", ["C11"]);
    expect(idsEd(S(), "intervencao.tipo")).toEqual(["ia"]);
    expect(orcamentoEd(S()).subtotal).toBe(1234.56);
    expect(lerEd(S(), "execucao.participantes").valor).toBe(250);
  });
  it("sobreposição equivalente mantém o mesmo orçamento ao combinar prioridades", () => {
    iniciar(["com"], ["C17"]);
    set("orcamento.itens.equipe", { situacao: "informado", valor: 500 });
    S().responder("prioridades", ["com", "para"]);
    S().responder("problemas", ["C17", "F1"]);
    expect(orcamentoEd(S()).subtotal).toBe(500);
    expect(temasEd(S())).toHaveLength(1);
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("prova de conceito técnica dispensa escolas, enquanto piloto as solicita", () => {
    iniciar();
    escolher("intervencao.tipo", "ia");
    escolher("avaliacao.tipo", "poc");
    expect(camposEd(S()).some((f) => f.caminho === "teste.escolas")).toBe(
      false,
    );
    escolher("avaliacao.tipo", "ambos");
    expect(camposEd(S()).some((f) => f.caminho === "teste.escolas")).toBe(true);
  });
  it("notas adicionais não se tornam desafios e ficam separadas por frente", () => {
    iniciar(["governar", "com"], ["G11", "C11"]);
    S().responder("govDetalhes.contexto", "Nota de governança");
    S().responder("frenteAtiva", "educacao");
    S().responder("educacao.contexto.detalhe", "Nota educacional");
    expect(desafiosGovernanca(S()).map((q) => q.id)).toEqual(["G11"]);
    expect(JSON.stringify(planoEd(S()).blocos)).toContain("Nota educacional");
    expect(JSON.stringify(planoEd(S()).blocos)).not.toContain(
      "Nota de governança",
    );
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("trocar prioridades retira os impactos e metas inativos e recupera as respostas ao voltar", () => {
    iniciar();
    escolher("temas.fundamentos.objetivo", "objetivo");
    set("temas.fundamentos.meta", {
      valor: 88,
      situacao: "informado",
      detalhe: "Nota anterior",
    });
    S().responder("prioridades", ["para"]);
    expect(temasEd(S())).toHaveLength(0);
    expect(impactosPedagogicos(S())).toEqual([]);
    expect(JSON.stringify(planoEd(S()).blocos)).not.toContain("88");
    S().responder("problemas", ["F3"]);
    expect(temasEd(S())[0].id).toBe("projetos");
    expect(
      camposEd(S()).some((f) => f.caminho.startsWith("temas.fundamentos")),
    ).toBe(false);
    S().responder("prioridades", ["com"]);
    S().responder("problemas", ["C11"]);
    expect(lerEd(S(), "temas.fundamentos.meta")).toEqual({
      valor: 88,
      situacao: "informado",
      detalhe: "Nota anterior",
    });
    expect(
      valorEd(
        S(),
        camposEd(S()).find((f) => f.caminho === "temas.fundamentos.meta")!,
      ),
    ).toContain("88 — Nota anterior");
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("avança continuamente e retoma a primeira pendência de cada etapa", () => {
    iniciar();
    expect(vizinhos(S(), "problemas").proxima).toBe(
      "#/capitulo/2/ed-intervencao",
    );
    expect(vizinhos(S(), "ed-execucao").anterior).toBe(
      "#/capitulo/2/ed-avaliacao",
    );
    expect(vizinhos(S(), "ed-expansao").proxima).toBe("#/plano");
    expect(entradaEtapa(S(), 2)).toBe("#/capitulo/2/ed-intervencao");
    escolher("intervencao.tipo", "sem");
    escolher("intervencao.recursos", "presencial");
    expect(entradaEtapa(S(), 2)).toBe("#/capitulo/2/ed-objetivos");
    escolher("avaliacao.tipo", "piloto");
    expect(vizinhos(S(), "ed-execucao").anterior).toBe("#/capitulo/2/ed-teste");
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("números desconhecidos e zero são distintos e metas percentuais aceitam decimais até 100", () => {
    iniciar();
    const f = camposEd(S()).find(
      (f) => f.caminho === "temas.fundamentos.meta",
    )!;
    escolher("temas.fundamentos.unidade", "percentual");
    set(f.caminho, { valor: 80.5, situacao: "informado" });
    expect(campoEdRespondido(S(), f)).toBe(true);
    set(f.caminho, { valor: 101, situacao: "informado" });
    expect(campoEdRespondido(S(), f)).toBe(false);
    set(f.caminho, { valor: 0, situacao: "informado" });
    expect(campoEdRespondido(S(), f)).toBe(true);
    set(f.caminho, { valor: 80.5, situacao: "a_levantar" });
    expect(valorEd(S(), f)).toBe("Informação a levantar");
    set(f.caminho, { valor: 80.5, situacao: "informado" });
    expect(lerEd(S(), f.caminho).valor).toBe(80.5);
  });
  it("orçamento usa valores próprios e distingue desconhecido, sem custo e valor informado", () => {
    iniciar();
    set("orcamento.itens.equipe", { situacao: "informado", valor: 1234.56 });
    set("orcamento.itens.materiais", { situacao: "sem_custo", valor: 900 });
    set("orcamento.itens.formacao", { situacao: "a_estimar", valor: 2000 });
    const o = orcamentoEd(S());
    expect(o.subtotal).toBe(1234.56);
    expect(o.faltam).toBe(3);
    expect(o.total).toBeNull();
    expect(lerEd(S(), "orcamento.itens.formacao").valor).toBe(2000);
  });
  it("retira os custos digitais e de IA ao mudar a abordagem, preservando os dados para retorno", () => {
    iniciar();
    escolher("intervencao.tipo", "ia");
    set("orcamento.itens.ia", { situacao: "informado", valor: 300 });
    set("orcamento.itens.digital", { situacao: "informado", valor: 200 });
    expect(orcamentoEd(S()).subtotal).toBe(500);
    escolher("intervencao.tipo", "sem");
    expect(orcamentoEd(S()).subtotal).toBe(0);
    expect(lerEd(S(), "orcamento.itens.ia").valor).toBe(300);
    escolher("intervencao.tipo", "ia");
    expect(orcamentoEd(S()).subtotal).toBe(500);
  });
  it("compartilha referências sem somar novamente valores de governança ou letramento", () => {
    iniciar(["governar", "sobre", "com"], ["G11", "A11", "C11"]);
    S().responder("frenteAtiva", "educacao");
    S().responder("govOrcamento.itens.equipe", {
      situacao: "informado",
      valor: 4000,
    });
    set("orcamento.itens.equipe", {
      situacao: "governanca",
      referencia: "equipe",
    });
    const item = orcamentoEd(S()).itens[0];
    expect(item.respondido).toBe(true);
    expect(item.valor).toBeNull();
    expect(orcamentoEd(S()).subtotal).toBe(0);
    set("orcamento.itens.equipe", {
      situacao: "governanca",
      referencia: "removido",
    });
    expect(orcamentoEd(S()).itens[0].respondido).toBe(false);
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("recurso adicional precisa de tipo e valor/situação e aparece no plano", () => {
    iniciar();
    set("orcamento.adicionais.adicional-1", {
      nome: "Assessoria especializada",
    });
    set("orcamento.itens.adicional-1", {
      situacao: "informado",
      valor: 300,
      detalhe: "Nota pessoal",
    });
    expect(orcamentoEd(S()).subtotal).toBe(300);
    expect(JSON.stringify(planoEd(S()).blocos)).toContain("Nota pessoal");
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("preserva posição, notas, moeda e dados legados ao exportar e importar", () => {
    iniciar();
    set("temas.fundamentos.meta", {
      valor: 80,
      situacao: "informado",
      detalhe: "Nota livre",
    });
    set("orcamento.moeda", "BRL");
    S().responder("resultado", "Meta escrita antes da revisão");
    S().responder("piloto.participantes", 30);
    S().irPara(2, "ed-objetivos");
    S().importar(JSON.stringify(S().exportar()));
    expect(S().capitulo.pergunta).toBe("ed-objetivos");
    expect(lerEd(S(), "orcamento.moeda")).toBe("BRL");
    expect(S().caso.resultado).toContain("antes da revisão");
    expect(S().caso.piloto.participantes).toBe(30);
    expect(lerEd(S(), "temas.fundamentos.meta").detalhe).toBe("Nota livre");
    expect(destinoContinuar(S(), faltamDe(S())).href).toBe(
      "#/capitulo/2/ed-objetivos",
    );
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("links antigos de ferramenta têm destino educacional válido", () => {
    iniciar();
    for (const id of [
      "impactos",
      "tarefas",
      "pagamento",
      "piloto",
      "expansao",
    ]) {
      S().irPara(id === "expansao" ? 4 : 2, id);
      const destino = destinoContinuar(S(), faltamDe(S()));
      expect(lerRota(destino.href).tipo).toBe("pergunta");
      expect(destino.href).not.toContain("/tarefas");
    }
    expect(lerRota(href.pergunta(2, "ed-objetivos"))).toEqual({
      tipo: "pergunta",
      n: 2,
      tela: "ed-objetivos",
    });
  });
  it.each([
    ["com", "C11"],
    ["para", "F2"],
  ])(
    "completa o caminho %s sem ferramenta e gera os dois PDFs",
    async (pr, id) => {
      iniciar([pr], [id]);
      completar();
      expect(faltamDe(S())).toEqual([]);
      expect(planoEd(S()).proxima).toContain("Revise e aprove");
      expect(orcamentoEd(S()).total).toBe(0);
      const docs = [
        await gerarEducacaoPDF(S(), { tipo: "brief", fontes: null }),
        await gerarEducacaoPDF(S(), { tipo: "anexo", fontes: null }),
      ];
      expect(docs[1].getNumberOfPages()).toBeGreaterThan(1);
      if (process.env.V015_ED_QA) {
        mkdirSync(process.env.V015_ED_QA, { recursive: true });
        docs.forEach((d, i) =>
          writeFileSync(
            process.env.V015_ED_QA + "/" + pr + "-" + i + ".pdf",
            Buffer.from(d.output("arraybuffer")),
          ),
        );
        writeFileSync(
          process.env.V015_ED_QA + "/" + pr + "-modelo.json",
          JSON.stringify(planoEd(S()), null, 2),
        );
      }
    },
  );
  it("informações a levantar permitem continuar sem declarar o plano pronto", () => {
    iniciar();
    completar();
    set("orcamento.itens.equipe", { situacao: "a_estimar" });
    expect(faltamDe(S())).toEqual([]);
    expect(planoEd(S()).pendentes).toBeGreaterThan(0);
    expect(planoEd(S()).proxima).not.toContain("Revise e aprove");
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("expansão não pode ter menos participantes que a execução", () => {
    iniciar();
    completar();
    escolher("expansao.decisao", "ampliar");
    set("expansao.participantes", { valor: 100, situacao: "informado" });
    expect(edRespondido(S(), "ed-expansao")).toBe(false);
    set("expansao.participantes", { valor: 500, situacao: "informado" });
    expect(edRespondido(S(), "ed-expansao")).toBe(true);
  });
  it("frentes combinadas separam governança, formação e intervenção sem perder respostas", () => {
    iniciar(["governar", "sobre", "com"], ["G11", "A11", "C11"]);
    expect(percursoGovernanca(S().ctx)).toBe(true);
    expect(desafiosGovernanca(S()).map((q) => q.id)).toEqual(["G11"]);
    S().responder("frenteAtiva", "educacao");
    expect(percursoPedagogico(S().ctx)).toBe(true);
    expect(temasEd(S()).map((q) => q.id)).toEqual(["fundamentos"]);
    S().responder("frenteAtiva", "letramento");
    expect(percursoLetramento(S().ctx)).toBe(true);
    S().responder("prioridades", ["governar"]);
    expect(percursoGovernanca(S().ctx)).toBe(true);
    expect(S().ctx.problemas).toContain("C11");
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip("navegação institucional cruza etapas e aponta o campo que falta", () => {
    iniciar(["governar"], ["G11"]);
    S().responder("redeNacional", { escolas: 120, estudantes: 12000 });
    expect(vizinhos(S(), "problemas").proxima).toBe(
      "#/capitulo/2/gov-diagnostico",
    );
    expect(pendenciasGov(S(), "gov-diagnostico").map((p) => p.caminho)).toEqual(
      [
        "govDiagnostico.atual",
        "govDiagnostico.resultado",
        "govDiagnostico.linhaBase",
        "govDiagnostico.fonte",
      ],
    );
    for (const p of pendenciasGov(S(), "gov-diagnostico")) {
      const id = presetGovernanca(S(), p.caminho).opcoes[0].id;
      S().responder("govSelecoes", {
        ...S().ctx.govSelecoes,
        [p.caminho]: [id],
      });
    }
    expect(governancaRespondida(S(), "gov-diagnostico")).toBe(true);
    expect(pendenciasGov(S(), "gov-diagnostico")).toEqual([]);
    expect(entradaEtapa(S(), 2)).toBe("#/capitulo/2/gov-instrumentos");
  });
});
