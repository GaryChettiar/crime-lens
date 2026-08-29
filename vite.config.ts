import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Custom lightweight plugin to load .geojson files as JSON modules
const geojsonPlugin = () => ({
  name: "geojson-loader",
  transform(code: string, id: string) {
    if (id.endsWith(".geojson")) {
      return {
        code: `export default ${code};`,
        map: null,
      };
    }
    return null;
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), geojsonPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/news-api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-api/, ""),
      },
      "/auth": {
        target:
          "https://crimelens-be-50043087097.development.catalystappsail.in",
        changeOrigin: true,
        secure: true,
      },
      "/configurations": {
        target:
          "https://crimelens-be-50043087097.development.catalystappsail.in",
        changeOrigin: true,
        secure: true,
      },
      "/network-analysis": {
        target:
          "https://crimelens-be-50043087097.development.catalystappsail.in",
        changeOrigin: true,
        secure: true,
      },
      "/roles": {
        target:
          "https://crimelens-be-50043087097.development.catalystappsail.in",
        changeOrigin: true,
        secure: true,
      },
      "/users": {
        target:
          "https://crimelens-be-50043087097.development.catalystappsail.in",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["react-is"],
  },
});
