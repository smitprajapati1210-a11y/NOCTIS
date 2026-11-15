import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { createAuthConfig } from "../../server/auth.ts";

export const authClient = createAuthClient({
  fetchOptions: { credentials: "same-origin" },
  plugins: [
    inferAdditionalFields<ReturnType<typeof createAuthConfig>["options"]>(),
  ],
});
