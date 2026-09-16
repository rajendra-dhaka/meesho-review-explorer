import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: "extension",
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/extension/content.jsx",
      output: {
        entryFileNames: "content.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "styles.css";
          return "assets/[name]-[hash][extname]";
        },
        format: "iife",
        name: "MeeshoReviewExplorer",
      },
    },
  },
});
