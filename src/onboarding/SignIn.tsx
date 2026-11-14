import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { EntryFrame } from "./EntryFrame";
import { authClient } from "./authClient";

type Mode = "signin" | "signup" | "forgot" | "reset";
type Provider = "google" | "apple";
type Providers = {
  google: boolean;
  mailEnabled: boolean;
  passwordEnabled: boolean;
};
const headings = {
  signin: ["Come on in.", "Sign in to open your sleep journal."],
  signup: ["Make it yours.", "Create your NOCTIS account."],
  forgot: [
    "Reset your password.",
    "Enter the email address you use for NOCTIS.",
  ],
  reset: ["Choose a new password.", "Use at least 12 characters."],
} satisfies Record<Mode, [string, string]>;

function ProviderMark({ provider }: { provider: Provider }) {
  return (
    <img
      className="entry-provider-mark"
      width="18"
      height="18"
      alt=""
      src={`/onboarding/${provider}.svg`}
    />
  );
}

function messageFor(
  code?: string,
  fallback = "Something went wrong. Try again in a moment.",
) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
      return "That email and password don’t match. Check them and try again.";
    case "EMAIL_NOT_VERIFIED":
      return "Check your inbox for a new verification link.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Use the sign-in method you chose when you created this account.";
    case "PASSWORD_TOO_SHORT":
      return "Choose a password with at least 12 characters.";
    case "TOO_MANY_REQUESTS":
      return "There have been too many attempts. Wait a minute and try again.";
    case "INVALID_TOKEN":
      return "This link has expired. Request a new password reset link.";
    default:
      return fallback;
  }
}

export default function SignIn({
  onReplay,
  onSession,
  connectionError,
  callbackError,
  resetToken,
  resetRequested,
  onResetComplete,
}: {
  onReplay: () => void;
  onSession: () => Promise<void>;
  connectionError: boolean;
  callbackError: boolean;
  resetToken: string | null;
  resetRequested: boolean;
  onResetComplete: () => void;
}) {
  const [mode, setMode] = useState<Mode>(resetRequested ? "reset" : "signin");
  const [providers, setProviders] = useState<Providers | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const [error, setError] = useState(
    resetRequested && !resetToken
      ? "This reset link has expired. Request a new link."
      : callbackError
        ? "Sign-in didn’t finish. Choose a method and try again."
        : "",
  );
  const [status, setStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const returnUrl = `${window.location.origin}/?account=callback`;
  const canUsePassword = providers?.passwordEnabled !== false;

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/noctis/auth-options", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Account service unavailable.");
        return response.json();
      })
      .then((data: Providers) => setProviders(data))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [mode]);

  function switchMode(next: Mode) {
    if (active.current || !canUsePassword) return;
    setMode(next);
    if (mode === "reset") onResetComplete();
    setPassword("");
    setVisible(false);
    setError("");
    setStatus("");
  }

  async function signInWithGoogle() {
    if (active.current || !providers?.google) return;
    active.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: returnUrl,
        errorCallbackURL: returnUrl,
      });
      if (result.error) {
        setError(
          messageFor(
            result.error.code,
            "Couldn’t open Google sign-in. Try again.",
          ),
        );
      } else if (result.data?.url) {
        return;
      } else {
        await onSession();
      }
    } catch {
      setError("Couldn’t reach sign-in. Check your connection and try again.");
    }
    active.current = false;
    setBusy(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (active.current || !canUsePassword) return;
    active.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const address = email.trim().toLowerCase();
      if (mode === "reset") {
        if (!resetToken) {
          setError(messageFor("INVALID_TOKEN"));
          return;
        }
        const result = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        });
        if (result.error) setError(messageFor(result.error.code));
        else {
          onResetComplete();
          setMode("signin");
          setPassword("");
          setStatus("Password updated. Sign in with your new password.");
        }
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email: address,
          redirectTo: `${window.location.origin}/?account=reset`,
        });
        if (result.error) setError(messageFor(result.error.code));
        else
          setStatus(
            "If this email belongs to an account, a reset link is on its way.",
          );
      } else {
        const result =
          mode === "signup"
            ? await authClient.signUp.email({
                name: name.trim(),
                email: address,
                password,
                callbackURL: returnUrl,
              })
            : await authClient.signIn.email({
                email: address,
                password,
                callbackURL: returnUrl,
                rememberMe: true,
              });
        if (result.error?.code === "EMAIL_NOT_VERIFIED") {
          setStatus(messageFor(result.error.code));
        } else if (result.error) {
          setError(
            messageFor(
              result.error.code,
              result.error.status === 429
                ? messageFor("TOO_MANY_REQUESTS")
                : undefined,
            ),
          );
        } else if (mode === "signup" && !result.data?.token) {
          setPassword("");
          setStatus("Check your inbox and verify your email to sign in.");
        } else {
          await onSession();
        }
      }
    } catch {
      setError("Couldn’t reach NOCTIS. Check your connection and try again.");
    } finally {
      active.current = false;
      setBusy(false);
    }
  }

  const [title, description] = headings[mode];
  return (
    <EntryFrame
      headerAction={
        <button
          type="button"
          className="entry-link"
          onClick={onReplay}
          disabled={busy}
        >
          Introduction
        </button>
      }
    >
      <main className="entry-stage entry-login">
        <div className="entry-login-content">
          <div className="entry-story">
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            <p>{description}</p>
          </div>
          {(mode === "signin" || mode === "signup") && (
            <>
              <div className="entry-providers">
                <button
                  type="button"
                  disabled={busy || !providers?.google}
                  onClick={() => void signInWithGoogle()}
                >
                  <ProviderMark provider="google" /> Continue with Google
                </button>
                <button type="button" disabled>
                  <ProviderMark provider="apple" /> Continue with Apple
                </button>
              </div>
              {providers && !providers.google && (
                <p className="entry-provider-status">
                  Google sign-in is awaiting setup.
                </p>
              )}
              {canUsePassword ? (
                <div className="entry-divider">
                  <span>or use email</span>
                </div>
              ) : (
                <p className="entry-provider-status">
                  Use Google to join the beta.
                </p>
              )}
            </>
          )}
          <form
            className="entry-form"
            onSubmit={submit}
            hidden={!canUsePassword}
          >
            {mode === "signup" && (
              <label className="field">
                Name
                <input
                  autoComplete="name"
                  required
                  maxLength={80}
                  pattern=".*\S.*"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}
            {mode !== "reset" && (
              <label className="field">
                Email address
                <input
                  type="email"
                  autoComplete={mode === "signin" ? "username" : "email"}
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            {mode !== "forgot" && (
              <div className="entry-password">
                <label className="field">
                  Password
                  <input
                    type={visible ? "text" : "password"}
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "signin" ? undefined : 12}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}
            {mode === "signup" && (
              <p className="entry-form-note">
                {providers?.mailEnabled === false
                  ? "Use a new password for this local account, at least 12 characters."
                  : "Use at least 12 characters."}
              </p>
            )}
            {canUsePassword && (error || connectionError) && (
              <p className="entry-error" role="alert">
                {error ||
                  "The account service is unavailable. Check that NOCTIS is running."}
              </p>
            )}
            {status && (
              <p className="entry-status" role="status">
                {status}
              </p>
            )}
            <button
              className="entry-primary"
              type="submit"
              disabled={busy || (mode === "reset" && !resetToken)}
            >
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : mode === "reset"
                      ? "Save password"
                      : "Sign in with email"}
              {mode === "forgot" ? (
                <Mail size={17} aria-hidden="true" />
              ) : (
                <ArrowRight size={18} aria-hidden="true" />
              )}
            </button>
          </form>
          {!canUsePassword && (error || connectionError) && (
            <p className="entry-error" role="alert">
              {error ||
                "The account service is unavailable. Try again in a moment."}
            </p>
          )}
          {canUsePassword && (
            <div className="entry-login-actions">
              {mode === "signin" ? (
                <>
                  <button
                    className="entry-link"
                    type="button"
                    disabled={busy}
                    onClick={() => switchMode("signup")}
                  >
                    Create an account
                  </button>
                  {providers?.mailEnabled && (
                    <button
                      className="entry-link"
                      type="button"
                      disabled={busy}
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="entry-link"
                  type="button"
                  disabled={busy}
                  onClick={() => switchMode("signin")}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </EntryFrame>
  );
}
