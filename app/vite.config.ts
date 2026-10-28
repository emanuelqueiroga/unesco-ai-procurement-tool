import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A saída vai para docs/app (GitHub Pages serve docs/); a v13 continua em docs/index.html até a publicação da 0.1.0.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../docs/app', emptyOutDir: true },
  test: { environment: 'node', include: ['tests/unit/**/*.test.{ts,js}'] },
});
