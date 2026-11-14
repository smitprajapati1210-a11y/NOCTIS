import type { Config, Context } from "@netlify/functions";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createAuthConfig } from "../../server/auth.ts";

const headers = { "Cache-Control": "no-store" };

function setup() {
  const env = {
    ...process.env,
    NOCTIS_URL: process.env.NOCTIS_URL || process.env.URL,
  };
  const connectionString = process.env.NETLIFY_DB_URL;
  if (!connectionString) throw new Error("Netlify Database is not configured.");
  const database = new Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });
  database.on("error", () => console.error("NOCTIS database connection lost."));
  const { options, providers } = createAuthConfig({
    env,
    port: 443,
    database,
    secret: process.env.BETTER_AUTH_SECRET || "",
  });
  return { auth: betterAuth(options), providers, origin: options.baseURL };
}

let service: ReturnType<typeof setup> | undefined;

export default async function handle(request: Request, context: Context) {
  const url = new URL(request.url);
  const isOptions =
    url.pathname === "/api/noctis/auth-options" && request.method === "GET";
  if (!isOptions && !url.pathname.startsWith("/api/auth/")) {
    return new Response(null, { status: 404, headers });
  }

  try {
    service ??= setup();
    if (url.origin !== service.origin) {
      return new Response("Open NOCTIS at its main HTTPS address.", {
        status: 400,
        headers,
      });
    }
    if (isOptions) return Response.json(service.providers, { headers });

    const authRequest = new Request(request);
    authRequest.headers.set("x-noctis-client-ip", context.ip);
    const response = await service.auth.handler(authRequest);
    const result = new Response(response.body, response);
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch {
    console.error(
      "NOCTIS authentication is unavailable. Check the server environment and database.",
    );
    return Response.json(
      { error: "Account service unavailable." },
      { status: 503, headers },
    );
  }
}

export const config: Config = {
  path: ["/api/auth/*", "/api/noctis/auth-options"],
};
