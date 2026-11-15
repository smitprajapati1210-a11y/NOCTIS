import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { SMTPServer } from "smtp-server";
import { createAuthServer } from "../server/auth.ts";

async function authFixture(
  t: TestContext,
  env: NodeJS.ProcessEnv = {},
  preview = true,
) {
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
    preview,
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

test("configured Google sign-in uses the registered callback and leaves Apple inactive", async (t) => {
  const { request, origin } = await authFixture(t, {
    NOCTIS_URL: "https://noctis.example.test",
    GOOGLE_CLIENT_ID: "test-google-id",
    GOOGLE_CLIENT_SECRET: "fixture-google-secret",
  });
  const available = await request("noctis/auth-options");
  assert.deepEqual(await available.json(), {
    google: true,
    mailEnabled: false,
    passwordEnabled: true,
  });
  const callbackURL = `${origin}/?account=callback`;
  const start = await request("auth/sign-in/social", {
    provider: "google",
    callbackURL,
  });
  assert.equal(start.status, 200, await start.clone().text());
  const authorization = new URL((await start.json()).url);
  assert.equal(authorization.hostname, "accounts.google.com");
  assert.equal(
    authorization.searchParams.get("redirect_uri"),
    `${origin}/api/auth/callback/google`,
  );
  assert.ok(authorization.searchParams.get("state"));
  assert.equal(authorization.searchParams.get("prompt"), "select_account");
  assert.ok(
    !(await request("auth/sign-in/social", { provider: "apple", callbackURL }))
      .ok,
  );
});

test("profile edits are private to the signed-in account and persist after signing out", async (t) => {
  const { request } = await authFixture(t);
  const credentials = {
    email: "profile@example.test",
    password: "profile test password 123",
  };
  const details = {
    profileName: "smit",
    phoneNumber: "+91 90000 12345",
    profilePhoto: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2Q==",
  };
  assert.equal((await request("auth/update-user", details)).status, 401);
  const initial = await request("auth/sign-up/email", {
    ...credentials,
    name: "Profile fixture",
  });
  const cookie = initial.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  assert.equal(
    (await request("auth/update-user", { phoneNumber: "invalid" }, cookie))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        "auth/update-user",
        { profilePhoto: "javascript:alert(1)" },
        cookie,
      )
    ).status,
    400,
  );
  const saved = await request("auth/update-user", details, cookie);
  assert.equal(saved.status, 200, await saved.clone().text());
  assert.ok((await request("auth/sign-out", {}, cookie)).ok);
  const login = await request("auth/sign-in/email", credentials);
  const signedIn = (await login.json()).user;
  assert.equal(signedIn.email, credentials.email);
  for (const [key, value] of Object.entries(details))
    assert.equal(signedIn[key], value);
  const other = await request("auth/sign-up/email", {
    ...credentials,
    email: "other-profile@example.test",
    name: "Another fixture",
  });
  const otherUser = (await other.json()).user;
  for (const key of Object.keys(details)) assert.ok(!otherUser[key]);
});

test("public account email verifies ownership and password reset revokes earlier sessions", async (t) => {
  const messages: string[] = [];
  const smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, _session, done) {
      let message = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk) => (message += chunk));
      stream.on("error", done);
      stream.on("end", () => {
        messages.push(message);
        done();
      });
    },
  });
  await new Promise<void>((resolve) => smtp.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve) => smtp.close(resolve)));
  const smtpAddress = smtp.server.address();
  assert.ok(smtpAddress && typeof smtpAddress !== "string");

  const { request, origin } = await authFixture(
    t,
    {
      NOCTIS_URL: "https://noctis.example.test",
      BETTER_AUTH_SECRET: "public-auth-test-fixture-secret-0000000000000000",
      NOCTIS_SMTP_URL: `smtp://127.0.0.1:${smtpAddress.port}`,
      NOCTIS_MAIL_FROM: "NOCTIS <no-reply@example.test>",
    },
    false,
  );
  const emailLink = (subject: string) => {
    const message = messages.find((item) =>
      item.includes(`Subject: ${subject}`),
    );
    assert.ok(message);
    const body = message.slice(message.indexOf("\r\n\r\n") + 4);
    const decoded = body.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
    const link = decoded.match(/https:\/\/\S+/)?.[0];
    assert.ok(link);
    const url = new URL(link);
    assert.equal(url.origin, origin);
    return url;
  };
  const follow = (url: URL) =>
    request(url.pathname.slice("/api/".length) + url.search);
  const credentials = {
    email: "verified-sleeper@example.test",
    password: "original test password 123",
  };
  const callbackURL = `${origin}/?account=callback`;
  const created = await request("auth/sign-up/email", {
    ...credentials,
    name: "Verified sleeper",
    callbackURL,
  });
  assert.equal(created.status, 200, await created.clone().text());
  assert.equal(created.headers.getSetCookie().length, 0);
  assert.equal((await request("auth/sign-in/email", credentials)).status, 403);

  const verification = emailLink("Verify your email for NOCTIS");
  assert.equal(verification.pathname, "/api/auth/verify-email");
  const verified = await follow(verification);
  assert.equal(verified.status, 302);
  assert.equal(verified.headers.get("location"), callbackURL);
  const cookies = verified.headers.getSetCookie();
  assert.match(cookies.join(" "), /HttpOnly/i);
  assert.match(cookies.join(" "), /Secure/i);
  const cookie = cookies.map((item) => item.split(";")[0]).join("; ");
  const session = await request("auth/get-session", undefined, cookie);
  assert.equal((await session.json()).user.emailVerified, true);

  const resetRequested = await request("auth/request-password-reset", {
    email: credentials.email,
    redirectTo: `${origin}/?account=reset`,
  });
  assert.equal(resetRequested.status, 200, await resetRequested.clone().text());
  const resetLink = emailLink("Reset your NOCTIS password");
  assert.match(resetLink.pathname, /^\/api\/auth\/reset-password\//);
  const resetRedirect = await follow(resetLink);
  assert.equal(resetRedirect.status, 302);
  const token = new URL(
    resetRedirect.headers.get("location")!,
  ).searchParams.get("token");
  assert.ok(token);
  const newPassword = "updated test password 456";
  const reset = await request("auth/reset-password", { token, newPassword });
  assert.equal(reset.status, 200, await reset.clone().text());
  assert.equal(
    await (await request("auth/get-session", undefined, cookie)).json(),
    null,
  );
  assert.equal((await request("auth/sign-in/email", credentials)).status, 401);
  assert.equal(
    (
      await request("auth/sign-in/email", {
        ...credentials,
        password: newPassword,
      })
    ).status,
    200,
  );
});
