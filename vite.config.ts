import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createAuthServer } from "./server/auth.ts";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  return {
    plugins: [
      react(),
      {
        name: "noctis-auth",
        async configureServer(server) {
          const auth = await createAuthServer({
            env,
            port: server.config.server.port ?? 5173,
            preview: true,
          });
          server.httpServer?.once("close", auth.close);
          server.middlewares.use(auth.middleware);
        },
        async configurePreviewServer(server) {
          const auth = await createAuthServer({
            env,
            port: server.config.preview.port ?? 4173,
            preview: true,
          });
          server.httpServer.once("close", auth.close);
          server.middlewares.use(auth.middleware);
        },
      },
    ],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem,key,p8}",
          "**/.git/**",
          "**/.noctis/**",
          "**/session-secret",
          "**/*.sqlite*",
        ],
      },
    },
  };
});
