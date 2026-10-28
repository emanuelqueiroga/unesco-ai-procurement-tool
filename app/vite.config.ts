import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A saída vai para docs/app (GitHub Pages serve docs/); a v13 continua em docs/index.html até a publicação da 0.1.0.
// Versões de revisão (VITE_CANAL=revisao): a página não é indexada pelos buscadores.
const semIndexar = {
  name: 'sem-indexar-revisao',
  transformIndexHtml: (html: string) =>
    process.env.VITE_CANAL === 'revisao' ? html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />') : html,
};

export default defineConfig({
  plugins: [react(), semIndexar],
  base: './',
  // o app lê ../data/moedas.json e ../design (fora de app/) também no servidor de desenvolvimento
  server: { fs: { allow: ['..'] } },
  build: { outDir: '../docs/app', emptyOutDir: true, chunkSizeWarningLimit: 700 },
  test: { environment: 'node', include: ['tests/unit/**/*.test.{ts,tsx,js}'] },
});
