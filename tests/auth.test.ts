import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { createAuthServer } from "../server/auth.ts";

async function authFixture(t: TestContext, env: NodeJS.ProcessEnv = {}) {
  const directory = await mkdtemp(join(tmpdir(), "noctis-auth-test-"));
  let auth: Awaited<ReturnType<typeof createAuthServer>>;
  const server = createServer((req, res) =>
    auth.middleware(req, res, () => {
      res.writeHead(404).end();
    }),
  );
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    auth?.close();
    await rm(directory, { recursive: true, force: true });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}`;
  const origin = env.NOCTIS_URL || url;
  auth = await createAuthServer({
    env: { ...env, NOCTIS_AUTH_DATA_DIR: directory },
    port: address.port,
    preview: true,
  });
  const request = (path: string, body?: object, cookie?: string) =>
    new Promise<Response>((resolve, reject) => {
      const req = httpRequest(
        `${url}/api/${path}`,
        {
          method: body ? "POST" : "GET",
          headers: {
            Host: new URL(origin).host,
            Origin: origin,
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("error", reject);
          res.on("end", () => {
            const headers = new Headers();
            for (let i = 0; i < res.rawHeaders.length; i += 2) {
              headers.append(res.rawHeaders[i], res.rawHeaders[i + 1]);
            }
            resolve(
              new Response(Buffer.concat(chunks), {
                status: res.statusCode,
                headers,
              }),
            );
          });
        },
      );
      req.on("error", reject);
      req.end(body ? JSON.stringify(body) : undefined);
    });
  return { request, origin };
}

test("email sign-up gives a server session, and sign-out revokes it", async (t) => {
  const { request } = await authFixture(t);
  const credentials = {
    email: "fixture@example.test",
    password: "test-only password 123",
  };
  const loggedOut = await request("auth/get-session");
  assert.equal(await loggedOut.json(), null);
  const created = await request("auth/sign-up/email", {
    name: "Test sleeper",
    ...credentials,
  });
  assert.equal(created.status, 200, await created.clone().text());
  const cookie = created.headers
    .getSetCookie()
    .map((item) => item.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  assert.match(created.headers.getSetCookie().join(" "), /HttpOnly/i);
  const session = await request("auth/get-session", undefined, cookie);
  assert.equal((await session.json()).user.email, credentials.email);
  const denied = await request("auth/sign-in/email", {
    ...credentials,
    password: "wrong test password",
  });
  assert.equal(denied.status, 401);
  assert.equal((await request("auth/sign-out", {}, cookie)).status, 200);
  assert.equal(
    await (await request("auth/get-session", undefined, cookie)).json(),
    null,
  );
  const signedIn = await request("auth/sign-in/email", credentials);
  assert.equal(signedIn.status, 200);
  assert.ok(signedIn.headers.getSetCookie().length);
});

test("configured providers generate Google and Apple authorization URLs with their own callbacks", async (t) => {
  const { request, origin } = await authFixture(t, {
    NOCTIS_URL: "https://noctis.example.test",
    GOOGLE_CLIENT_ID: "test-google-id",
    GOOGLE_CLIENT_SECRET: "fixture-google-secret",
    APPLE_CLIENT_ID: "test.noctis.web",
    APPLE_CLIENT_SECRET: "fixture-apple-secret",
  });
  const available = await request("noctis/auth-options");
  assert.deepEqual(await available.json(), {
    google: true,
    apple: true,
    mailEnabled: false,
  });
  for (const [provider, hostname] of [
    ["google", "accounts.google.com"],
    ["apple", "appleid.apple.com"],
  ]) {
    const start = await request("auth/sign-in/social", {
      provider,
      callbackURL: `${origin}/?account=callback`,
    });
    assert.equal(start.status, 200, await start.clone().text());
    const authorization = new URL((await start.json()).url);
    assert.equal(authorization.hostname, hostname);
    assert.equal(
      authorization.searchParams.get("redirect_uri"),
      `${origin}/api/auth/callback/${provider}`,
    );
    assert.ok(authorization.searchParams.get("state"));
  }
});
