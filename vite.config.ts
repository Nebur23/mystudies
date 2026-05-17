import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";


export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), viteStaticCopy({
    targets: [{
      src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
      dest: ".",
    }],
  }),],
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    noExternal: [],
    external: ["react-pdf", "pdfjs-dist"],
  },
});



