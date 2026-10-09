import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,          // no publicar el código fuente
    assetsInlineLimit: 0,      // nada inline: permite CSP estricta (sin 'unsafe-inline')
    target: "es2020",
  },
});
