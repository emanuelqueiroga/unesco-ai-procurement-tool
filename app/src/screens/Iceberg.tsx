// "O custo em resumo": um iceberg por fase (REL-05, porte de htmlIcebergsP da 0.0.15-rc.1). Acima da linha d'água, o
// preço da proposta; abaixo, o que a rede também paga. Dados de plano/relatorio.js:relIcebergs (já traduzidos).
// Cores só por tokens do Prumo (claro e escuro); os desenhos (pico e gelo submerso) são decorativos (aria-hidden):
// cada linha tem nome e valor em texto, e cada cartão tem uma frase de resumo para leitores de tela.
// Uma coluna por fase, que viram uma só abaixo de ~760 px; nada cria rolagem horizontal a 400 px.
import './plano.css';

export interface LinhaIceberg { k: string; nome: string; txt: string; w: number; zero: boolean }
export interface FaseIceberg {
  id: string; nome: string; anosTxt: string; mediaTxt: string; totalTxt: string; ocultoTxt: string; alt: string; pOculto: number;
  acima: LinhaIceberg[]; abaixo: LinhaIceberg[];
}
export interface DadosIceberg { h: string; abre: string; nota: string; acima: string; abaixo: string; mediaRot: string; fases: FaseIceberg[] }

function Linha({ x }: { x: LinhaIceberg }) {
  return (
    <li className={'pc-ice-l' + (x.zero ? ' pc-ice-l--zero' : '')} data-g={x.k}>
      <span className="pc-ice-l-nome">{x.nome}</span>
      <b className="pc-ice-l-valor">{x.txt}</b>
      <span className="pc-ice-barra" aria-hidden="true"><i style={{ inlineSize: (100 * Math.max(0, Math.min(1, x.w))).toFixed(1) + '%' }} /></span>
    </li>
  );
}

/** Pico do iceberg: duas faces, contorno e reflexos (decorativo). */
function Pico() {
  return (
    <svg className="pc-ice-pico" viewBox="0 0 200 64" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <path className="pc-ice-pico-luz" d="M18 64 L62 30 L76 40 L104 4 L124 32 L140 22 L182 64 Z" />
      <path className="pc-ice-pico-sombra" d="M104 4 L124 32 L140 22 L182 64 L112 64 L98 30 Z" />
      <path className="pc-ice-pico-borda" d="M18 64 L62 30 L76 40 L104 4 L124 32 L140 22 L182 64 Z" />
      <path className="pc-ice-pico-brilho" d="M104 4 L96 26 M104 4 L114 30 M62 30 L58 42" />
    </svg>
  );
}

/** Gelo submerso: mais largo quanto maior a parcela escondida (0,62 + 0,36 × p da largura). */
function Submerso({ p }: { p: number }) {
  const w = 0.62 + 0.36 * Math.max(0, Math.min(1, p)), l = 50 - 50 * w, r = 50 + 50 * w;
  const d = `M20 0 L80 0 L${(r - 2).toFixed(1)} 30 L${r.toFixed(1)} 62 L${(r - 8).toFixed(1)} 92 L58 100 L36 97 L${(l + 6).toFixed(1)} 84 L${l.toFixed(1)} 52 L${(l + 4).toFixed(1)} 24 Z`;
  return (
    <svg className="pc-ice-submerso" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export function Iceberg({ ice, titulo = true }: { ice: DadosIceberg; titulo?: boolean }) {
  if (!ice || !ice.fases.length) return null;
  return (
    <figure className="pc-ice" aria-labelledby="pc-ice-t">
      {titulo ? <h3 className="pc-secao-h3" id="pc-ice-t">{ice.h}</h3> : <span className="pc-sr" id="pc-ice-t">{ice.h}</span>}
      <p className="pc-nota">{ice.abre}</p>
      <div className="pc-ice-grade">
        {ice.fases.map((f) => (
          <article key={f.id} className="pc-ice-cartao" data-fase={f.id} aria-labelledby={'pc-ice-' + f.id}>
            <header className="pc-ice-cab">
              <h4 className="pc-ice-fase" id={'pc-ice-' + f.id}>{f.nome}</h4>
              <span className="pc-ice-anos">{f.anosTxt}</span>
              <span className="pc-sr">{f.alt}</span>
            </header>
            <div className="pc-ice-ceu">
              <Pico />
              <div className="pc-ice-caixa">
                <span className="pc-ice-rot">{ice.acima}</span>
                <ul className="pc-ice-linhas">{f.acima.map((x) => <Linha key={x.k} x={x} />)}</ul>
              </div>
            </div>
            <div className="pc-ice-agua">
              <Submerso p={f.pOculto} />
              <span className="pc-ice-rot">{ice.abaixo}</span>
              <ul className="pc-ice-linhas">{f.abaixo.map((x) => <Linha key={x.k} x={x} />)}</ul>
            </div>
            <footer className="pc-ice-pe">
              <span className="pc-ice-pe-rot">{ice.mediaRot}</span>
              <b className="pc-ice-pe-valor">{f.mediaTxt}</b>
              <span className="pc-ice-pe-rot">{f.totalTxt}</span>
              <span className="pc-ice-oculto">{f.ocultoTxt}</span>
            </footer>
          </article>
        ))}
      </div>
      <figcaption className="pc-nota">{ice.nota}</figcaption>
    </figure>
  );
}
