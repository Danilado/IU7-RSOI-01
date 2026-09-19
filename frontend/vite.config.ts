import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_TARGET = process.env.VITE_API_TARGET ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
