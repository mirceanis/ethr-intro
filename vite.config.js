import { defineConfig } from "vite";

const allowedHosts = ["localhost", ".local", ".ts.net"];

export default defineConfig({
  base: "/ethr-intro/",
  server: {
    host: "0.0.0.0",
    allowedHosts,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts,
  },
});
