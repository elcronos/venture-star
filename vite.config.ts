import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/svg/**/*.svg"],
      manifest: {
        name: "Venture Star",
        short_name: "Venture Star",
        description: "A procedural real-time frontier strategy game.",
        theme_color: "#091426",
        background_color: "#091426",
        display: "standalone",
        orientation: "any"
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,webp}"] }
    })
  ],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"]
  },
  build: { target: "es2022", sourcemap: true }
});
