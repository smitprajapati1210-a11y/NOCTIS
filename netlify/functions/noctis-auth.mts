import type { Config, Context } from "@netlify/functions";
import { createHostedAuthHandler } from "../../server/hostedAuth.ts";

const handle = createHostedAuthHandler(() => ({
  env: {
    ...process.env,
    NOCTIS_URL: process.env.NOCTIS_URL || process.env.URL,
  },
  connectionString: process.env.NETLIFY_DB_URL,
}));

export default function auth(request: Request, context: Context) {
  return handle(request, context.ip);
}

export const config: Config = {
  path: ["/api/auth/*", "/api/noctis/auth-options"],
};
