import { defineConfig, type PluginOption } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const viteManifestHackIssue846: PluginOption & {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  renderCrxManifest: (manifest: any, bundle: any) => void;
} = {
  // Workaround from https://github.com/crxjs/chrome-extension-tools/issues/846#issuecomment-1861880919.
  name: "manifestHackIssue846",
  renderCrxManifest(_manifest, bundle) {
    bundle["manifest.json"] = bundle[".vite/manifest.json"];
    bundle["manifest.json"].fileName = "manifest.json";
    // biome-ignore lint/performance/noDelete: <explanation>
    delete bundle[".vite/manifest.json"];
  },
};

const manifest = defineManifest({
  manifest_version: 3,
  name: "フリマアシストぷらす",
  version: "1.0.0",
  description: "フリマアシストを使って自動再出品をする拡張機能",
  permissions: ["tabs", "activeTab", "scripting", "storage"],
  host_permissions: ["https://jp.mercari.com/*"],
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
  icons: {
    128: "box.png",
  },
});

export default defineConfig({
  plugins: [viteManifestHackIssue846, crx({ manifest })],
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
