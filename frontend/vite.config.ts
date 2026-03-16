import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Esto permite que Railway (o cualquier host) sirva la app
    allowedHosts: [
      "frontend-production-f56d.up.railway.app", // Tu URL específica
      ".up.railway.app", // Opcional: permite cualquier subdominio de Railway
    ],
  },
});
