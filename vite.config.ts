import { crx, defineManifest } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'フリマアシストぷらす',
  version: '1.0.1',
  description: 'フリマアシストを使って自動再出品をする拡張機能',
  permissions: ['tabs', 'activeTab', 'scripting', 'storage'],
  host_permissions: ['https://jp.mercari.com/*'],
  background: {
    service_worker: 'src/background.ts',
  },
  content_scripts: [
    {
      matches: ['https://jp.mercari.com/todos', 'https://jp.mercari.com/mypage/listings'],
      js: ['src/content.ts'],
    },
  ],
  options_page: 'options.html',
  icons: {
    128: 'box.png',
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
