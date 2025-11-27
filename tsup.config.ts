import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    content: "src/extension/content.ts",
  },
  outDir: "dist/extension",
  format: ["esm"],
  target: "es2022",
  sourcemap: true,
  clean: true,
  minify: false,
  dts: false,
});
