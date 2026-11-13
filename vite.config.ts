import { defineConfig, type ViteDevServer } from "vite";
import { fileURLToPath } from "url";
import svgr from "vite-plugin-svgr";
import { execSync } from "child_process";

// The build number shown in the About window: the number of commits in the
// current branch's history, so it increases with every release
function getBuildNumber(): string {
  try {
    return execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const playerDistDir = fileURLToPath(new URL("./src/player/dist", import.meta.url));

function watchPlayerDist() {
  return {
    name: "watch-player-dist",
    configureServer(server: ViteDevServer) {
      server.watcher.add(playerDistDir);
      server.watcher.on("change", (file: string) => {
        const normalized = file.replaceAll("\\", "/");
        if (!normalized.includes("/player/dist/")) return;
        server.moduleGraph.fileToModulesMap.forEach((mods, key) => {
          if (key.includes("/player/dist/")) {
            mods.forEach((mod) => server.moduleGraph.invalidateModule(mod));
          }
        });
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}

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
    watchPlayerDist(),
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
  define: {
    __BUILD_NUMBER__: JSON.stringify(getBuildNumber()),
    __BUILD_YEAR__: new Date().getFullYear(),
  },
  resolve: {
    alias: {
      "@surfgreen/choicelab-player-html5": fileURLToPath(
        new URL("./src/player", import.meta.url)
      ),
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
}));
