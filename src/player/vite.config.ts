import { defineConfig } from "vite";
import { fileURLToPath } from "url";

const __playerDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: __playerDir,
  base: "./",
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "choicelab.js",
      },
    },
  },
});
