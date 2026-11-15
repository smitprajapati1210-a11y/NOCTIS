import { createHostedAuthHandler } from "./hostedAuth.js";

const handle = createHostedAuthHandler(() => ({
  env: process.env,
  connectionString: process.env.DATABASE_URL,
}));

export default {
  fetch(request: Request) {
    return handle(
      request,
      request.headers.get("x-vercel-forwarded-for") ?? undefined,
    );
  },
};
