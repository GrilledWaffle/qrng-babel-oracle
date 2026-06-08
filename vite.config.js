import { defineConfig } from 'vite';

// Single-page browser app. No backend.
// QRNG fetches go directly from the browser to api.quantumnumbers.anu.edu.au.
// Library of Babel links are constructed client-side and opened in a new tab.
export default defineConfig({
  root: '.',
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: true }
});
