import { defineConfig } from 'vite';
import { crx, defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'メルカリで使用する拡張機能',
  version: '1.0.0',
  description: 'フリマアシストの仕様をサポートする拡張機能',
  action: {
    default_popup: 'index.html',
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
