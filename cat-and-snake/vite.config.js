import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3001,
    open: false,
  }
});
