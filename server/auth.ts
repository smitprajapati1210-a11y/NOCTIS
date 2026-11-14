import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { toNodeHandler } from "better-auth/node";
import nodemailer from "nodemailer";

const loopback = ["localhost", "127.0.0.1", "[::1]"];

function localOrigins(port: number) {
  const privateIPv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((item) => item?.family === "IPv4" && privateIPv4.test(item.address))
    .map((item) => item!.address);
  return [...loopback, ...new Set(addresses)].map(
    (host) => `http://${host}:${port}`,
  );
}

function localSecret(directory: string): string {
  const file = join(directory, "session-secret");
  try {
    writeFileSync(file, randomBytes(32).toString("hex"), {
      mode: 0o600,
      flag: "wx",
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  return readFileSync(file, "utf8").trim();
}

export async function createAuthServer({
  env,
  port,
  preview = false,
}: {
  env: NodeJS.ProcessEnv;
  port: number;
  preview?: boolean;
}) {
  const publicUrl = env.NOCTIS_URL ? new URL(env.NOCTIS_URL) : undefined;
  if (
    publicUrl &&
    (publicUrl.origin === "null" || publicUrl.href !== `${publicUrl.origin}/`)
  ) {
    throw new Error("NOCTIS_URL must be the app’s origin, without a path.");
  }
  if (
    (!preview || publicUrl) &&
    !(
      publicUrl?.protocol === "https:" ||
      (preview &&
        publicUrl?.protocol === "http:" &&
        loopback.includes(publicUrl.hostname))
    )
  ) {
    throw new Error(
      "Use an HTTPS NOCTIS_URL for the public app. Local OAuth testing can use localhost.",
    );
  }

  const mailEnabled = !!(env.NOCTIS_SMTP_URL && env.NOCTIS_MAIL_FROM);
  const secretOverride = env.BETTER_AUTH_SECRET;
  if (
    !preview &&
    (!mailEnabled || !secretOverride || secretOverride.length < 32)
  ) {
    throw new Error(
      "Public sign-in requires SMTP, a sender address and a server secret of at least 32 characters.",
    );
  }
  const directory =
    env.NOCTIS_AUTH_DATA_DIR || (preview ? ".noctis" : ".noctis/production");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const secret = secretOverride || localSecret(directory);
  const database = new DatabaseSync(join(directory, "accounts.sqlite"));
  database.exec(
    "PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;",
  );
  const origins = publicUrl ? [publicUrl.origin] : localOrigins(port);
  const hosts = new Set(origins.map((origin) => new URL(origin).host));
  const google = !!(
    publicUrl &&
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET
  );
  const apple = !!(
    publicUrl?.protocol === "https:" &&
    env.APPLE_CLIENT_ID &&
    env.APPLE_CLIENT_SECRET
  );
  const mail = mailEnabled
    ? nodemailer.createTransport(env.NOCTIS_SMTP_URL!)
    : null;
  async function sendAccountEmail(to: string, subject: string, text: string) {
    if (!mail) throw new Error("Account email delivery is unavailable.");
    await mail.sendMail({ from: env.NOCTIS_MAIL_FROM, to, subject, text });
  }

  const options = {
    appName: "NOCTIS",
    database,
    secret,
    baseURL: publicUrl?.origin ?? {
      allowedHosts: [...hosts],
      protocol: "http",
    },
    trustedOrigins: apple ? [...origins, "https://appleid.apple.com"] : origins,
    advanced: {
      ipAddress: { ipAddressHeaders: ["x-noctis-client-ip"] },
      useSecureCookies: publicUrl?.protocol === "https:",
    },
    rateLimit: { enabled: true, storage: "database" },
    session: { expiresIn: 7 * 24 * 60 * 60 },
    account: { encryptOAuthTokens: true, accountLinking: { enabled: false } },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: mailEnabled,
      ...(mailEnabled
        ? {
            revokeSessionsOnPasswordReset: true,
            sendResetPassword: async ({ user, url }) =>
              sendAccountEmail(
                user.email,
                "Reset your NOCTIS password",
                `Open this link to reset your password:\n\n${url}\n\nIf you didn’t request a reset, you can ignore this email.`,
              ),
          }
        : {}),
    },
    ...(mailEnabled
      ? {
          emailVerification: {
            sendOnSignUp: true,
            sendOnSignIn: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url }) =>
              sendAccountEmail(
                user.email,
                "Verify your email for NOCTIS",
                `Open this link to verify your email address:\n\n${url}`,
              ),
          },
        }
      : {}),
    socialProviders: {
      ...(google
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID!,
              clientSecret: env.GOOGLE_CLIENT_SECRET!,
            },
          }
        : {}),
      ...(apple
        ? {
            apple: {
              clientId: env.APPLE_CLIENT_ID!,
              clientSecret: env.APPLE_CLIENT_SECRET!,
            },
          }
        : {}),
    },
    onAPIError: {
      errorURL: `${publicUrl?.origin ?? `http://localhost:${port}`}/?account=callback`,
    },
  } satisfies BetterAuthOptions;

  try {
    const migration = await getMigrations(options);
    await migration.runMigrations();
  } catch (error) {
    database.close();
    throw error;
  }

  const handleAuth = toNodeHandler(betterAuth(options));
  return {
    close: () => database.close(),
    middleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
      const path = req.url?.split("?")[0] ?? "";
      if (!path.startsWith("/api/")) return next();
      res.setHeader("Cache-Control", "no-store");
      if (!hosts.has(req.headers.host ?? "")) {
        res.statusCode = 400;
        res.end("Open NOCTIS using its configured address.");
        return;
      }
      if (path === "/api/noctis/auth-options" && req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ google, apple, mailEnabled }));
        return;
      }
      if (!path.startsWith("/api/auth/")) {
        res.statusCode = 404;
        res.end();
        return;
      }
      req.headers["x-noctis-client-ip"] =
        req.socket.remoteAddress ?? "127.0.0.1";
      void handleAuth(req, res).catch(() => {
        if (!res.headersSent) res.statusCode = 500;
        res.end();
      });
    },
  };
}
