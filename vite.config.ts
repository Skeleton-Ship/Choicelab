import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

function svgPrefixIdsPlugin(
  code: string,
  _config: unknown,
  state: { filePath?: string }
): string {
  const filename =
    state.filePath?.split(/[\\/]/).pop()?.replace(/\.svg$/, "") ?? "icon";
  const prefix = filename.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return code
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/\burl\(#([^)]+)\)/g, `url(#${prefix}-$1)`);
}

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    svgr({
      svgrOptions: {
        jsxRuntime: "classic",
        plugins: [svgPrefixIdsPlugin, "@svgr/plugin-jsx"],
      },
    }),
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
  },
  // 3. to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ["VITE_", "TAURI_"],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
}));
