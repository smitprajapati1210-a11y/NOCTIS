import { isIP } from "node:net";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createAuthConfig } from "./auth.js";

const headers = { "Cache-Control": "no-store" };

function setup(env: NodeJS.ProcessEnv, connectionString: string | undefined) {
  if (!connectionString) throw new Error("PostgreSQL is not configured.");
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
    secret: env.BETTER_AUTH_SECRET || "",
  });
  return { auth: betterAuth(options), providers, origin: options.baseURL };
}

export function createHostedAuthHandler(
  configuration: () => {
    env: NodeJS.ProcessEnv;
    connectionString: string | undefined;
  },
) {
  let service: ReturnType<typeof setup> | undefined;

  return async function handle(request: Request, clientIp?: string) {
    const url = new URL(request.url);
    const isOptions =
      url.pathname === "/api/noctis/auth-options" && request.method === "GET";
    if (!isOptions && !url.pathname.startsWith("/api/auth/")) {
      return new Response(null, { status: 404, headers });
    }

    try {
      if (!service) {
        const { env, connectionString } = configuration();
        service = setup(env, connectionString);
      }
      if (url.origin !== service.origin) {
        return new Response("Open NOCTIS at its main HTTPS address.", {
          status: 400,
          headers,
        });
      }
      if (isOptions) return Response.json(service.providers, { headers });

      const authRequest = new Request(request);
      authRequest.headers.set(
        "x-noctis-client-ip",
        clientIp && isIP(clientIp) ? clientIp : "127.0.0.1",
      );
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
  };
}
