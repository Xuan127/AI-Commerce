import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
  },
  define: {
    // Make environment variables available to the client
    "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(
      process.env.GOOGLE_MAPS_API_KEY
    ),
  },
});
