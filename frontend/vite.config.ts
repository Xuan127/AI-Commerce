import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Make environment variables available to the client
    "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(
      process.env.GOOGLE_MAPS_API_KEY
    ),
  },
});
