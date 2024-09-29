import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "メルカリで使用する拡張機能",
  version: "1.0.0",
  description: "フリマアシストの仕様をサポートする拡張機能",
  permissions: ["tabs", "activeTab", "scripting", "storage"],
  host_permissions: ["https://jp.mercari.com/*"],
  action: {
    default_popup: "index.html",
  },
  background: {
    service_worker: "src/background.ts",
  },
  content_scripts: [
    {
      matches: [
        "https://jp.mercari.com/todos",
        "https://jp.mercari.com/mypage/listings",
      ],
      js: ["src/content.ts"],
    },
  ],
  options_page: "options.html",
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Ctrl+Shift+Y",
      },
    },
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: "dist",
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
