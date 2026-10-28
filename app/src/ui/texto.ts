// Textos fixos dos componentes do Prumo. Os componentes não conhecem o i18n da ferramenta: a aplicação instala
// o tradutor com setTradutorUI (o mesmo tr() do domínio), e cada texto em português é a chave de tradução.
// Sem tradutor (galeria, testes), o texto sai em português.
type Tradutor = (s: string) => string;
let tradutor: Tradutor = (s) => s;
export function setTradutorUI(f: Tradutor) { tradutor = f; }
/** traduz e preenche {n}, {total}… */
export function tx(s: string, vars?: Record<string, string | number>): string {
  let out = String(tradutor(s) ?? s);
  if (vars) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(String(vars[k])); });
  return out;
}
