import { defineConfig } from "vite";

export default defineConfig({
  base: "/ethr-intro/",
  server: {
    host: "0.0.0.0",
  },
  build: {
    minify: false,
    cssMinify: false,
  },
});
