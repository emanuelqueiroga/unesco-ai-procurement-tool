import {
  telasAtivas,
  telasDoCapitulo,
  telaRespondida,
  type Estado14,
  type Capitulo,
} from "../store";
import { href } from "./rota";
export function entradaEtapa(s: Estado14, n: Capitulo) {
  const qs = telasDoCapitulo(n, s),
    q = qs.find((q) => !telaRespondida(s, q)) || qs[0];
  return q ? href.pergunta(q.capitulo, q.id) : href.plano();
}
export function vizinhos(s: Estado14, id: string) {
  const qs = telasAtivas(s),
    i = qs.findIndex((q) => q.id === id);
  const link = (q: (typeof qs)[number] | undefined, fim: string) =>
    q ? href.pergunta(q.capitulo, q.id) : fim;
  return {
    anterior: qs[i - 1]?.id === 'prioridades' && s.ctx.prioridades?.length > 1 ? href.frentes() : link(qs[i - 1], href.inicio()),
    proxima: link(qs[i + 1], href.plano()),
  };
}
export function focarPendencia(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === "DETAILS") (el as HTMLDetailsElement).open = true;
  const grupo = el.querySelector<HTMLDetailsElement>(
    ":scope > details.pc-lit-grupo",
  );
  if (grupo) grupo.open = true;
  let p = el.parentElement;
  while (p) {
    if (p.tagName === "DETAILS") (p as HTMLDetailsElement).open = true;
    p = p.parentElement;
  }
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: "center" });
    (
      el.querySelector<HTMLElement>(
        "input:not(:disabled),select,button,textarea",
      ) || el
    ).focus({ preventScroll: true });
  });
}
