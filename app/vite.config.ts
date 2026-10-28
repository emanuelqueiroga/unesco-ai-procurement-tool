import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A saída vai para docs/app (GitHub Pages serve docs/); a v13 continua em docs/index.html até a publicação da 0.1.0.
// Versões de revisão (VITE_CANAL=revisao): a página não é indexada pelos buscadores.
const semIndexar = {
  name: 'sem-indexar-revisao',
  transformIndexHtml: (html: string) =>
    process.env.VITE_CANAL === 'revisao' ? html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />') : html,
};

// A galeria de componentes do Prumo (#/galeria) é só de desenvolvimento: no build de produção a tela é trocada
// por um módulo que volta ao início (e a galeria, com o seu CSS, não entra no pacote). VITE_GALERIA=1 a mantém.
const semGaleria = {
  name: 'sem-galeria-na-producao',
  apply: 'build' as const,
  enforce: 'pre' as const,
  resolveId(id: string) { return process.env.VITE_GALERIA === '1' ? null : /(^|\/)screens\/Galeria$/.test(id) ? '\0galeria-vazia' : null; },
  load(id: string) {
    return id === '\0galeria-vazia'
      ? `import { useEffect } from 'react';\nexport function Galeria() { useEffect(() => { window.location.hash = '#/'; }, []); return null; }\n`
      : null;
  },
};

// Data do build (AAAA-MM-DD, UTC) para o rodapé; SOURCE_DATE_EPOCH (build reprodutível) tem prioridade.
const dataDoBuild = (() => {
  const e = Number(process.env.SOURCE_DATE_EPOCH);
  return (e > 0 ? new Date(e * 1000) : new Date()).toISOString().slice(0, 10);
})();

export default defineConfig({
  plugins: [react(), semIndexar, semGaleria],
  base: './',
  define: { __BUILD_DATE__: JSON.stringify(dataDoBuild) },
  // o app lê ../data/moedas.json e ../design (fora de app/) também no servidor de desenvolvimento
  server: { fs: { allow: ['..'] } },
  build: { outDir: '../docs/app', emptyOutDir: true, chunkSizeWarningLimit: 700 },
  test: { environment: 'node', include: ['tests/unit/**/*.test.{ts,tsx,js}'] },
});
