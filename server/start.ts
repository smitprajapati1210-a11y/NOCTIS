import { createServer } from "node:http";
import { existsSync } from "node:fs";
import serveStatic from "sirv";
import { createAuthServer } from "./auth.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (existsSync(".env")) process.loadEnvFile(".env");
if (!existsSync("dist/index.html")) throw new Error("Run npm run build first.");
const port = Number(process.env.PORT || 4173);
const auth = await createAuthServer({ env: process.env, port });
const serve = serveStatic("dist", { single: true, etag: true });
const server = createServer((req, res) =>
  auth.middleware(req, res, () => {
    serve(req, res, () => {
      res.statusCode = 404;
      res.end();
    });
  }),
);
server.on("close", auth.close);
server.listen(port, "127.0.0.1", () =>
  console.log(`NOCTIS listening on 127.0.0.1:${port}`),
);
