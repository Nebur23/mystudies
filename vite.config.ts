import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";


export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
    optimizeDeps: {
    // ✅ prevents Vite from trying to pre-bundle the worker
    exclude: ["pdfjs-dist"],
  },
  worker: {
    format: "es",
  },
});



