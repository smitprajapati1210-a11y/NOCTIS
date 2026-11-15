import { lazy, Suspense, useEffect, useState } from "react";
import { STORAGE_KEY, accountStorageKey } from "../storage";
import { authClient } from "./authClient";
import SignIn from "./SignIn";
import Walkthrough from "./Walkthrough";
import { EntryFrame } from "./EntryFrame";

const JournalApp = lazy(() => import("../App"));
const INTRO_KEY = "noctis.introduction.v1";

function Loading() {
  return (
    <EntryFrame>
      <main className="entry-stage entry-loading" role="status">
        Opening NOCTIS…
      </main>
    </EntryFrame>
  );
}

export default function AccountGate() {
  const session = authClient.useSession();
  const [returnState] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const resetRequested = returnState.get("account") === "reset";
  const [resetting, setResetting] = useState(resetRequested);
  const [intro, setIntro] = useState(() => {
    if (returnState.has("account") || returnState.has("error")) return false;
    try {
      return localStorage.getItem(INTRO_KEY) !== "complete";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!returnState.has("account") && !returnState.has("error")) return;
    const url = new URL(window.location.href);
    for (const key of ["account", "token", "error", "error_description"])
      url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  }, [returnState]);

  function finishIntro() {
    try {
      localStorage.setItem(INTRO_KEY, "complete");
    } catch {
      /* The introduction still advances. */
    }
    setIntro(false);
  }

  const user = session.data?.user;
  if (session.isPending && !user && !resetting) return <Loading />;
  if (user && !resetting) {
    return (
      <Suspense fallback={<Loading />}>
        <JournalApp
          key={user.id}
          storageKey={accountStorageKey(user.id)}
          legacyStorageKey={STORAGE_KEY}
          account={{
            email: user.email,
            profileName: user.profileName ?? undefined,
            profilePhoto: user.profilePhoto ?? undefined,
            phoneNumber: user.phoneNumber ?? undefined,
            updateProfile: async (profile) => {
              const { error } = await authClient.updateUser(profile);
              if (error)
                throw new Error("Couldn’t save your profile. Try again.");
              await session.refetch();
            },
            signOut: async () => {
              finishIntro();
              const { error } = await authClient.signOut();
              if (error)
                throw new Error("Couldn’t sign out. Please try again.");
              await session.refetch();
            },
          }}
        />
      </Suspense>
    );
  }
  if (intro && !resetting) return <Walkthrough onFinish={finishIntro} />;
  return (
    <SignIn
      onReplay={() => {
        setResetting(false);
        setIntro(true);
      }}
      onSession={session.refetch}
      connectionError={!!session.error}
      callbackError={returnState.has("error") && !resetRequested}
      resetRequested={resetting}
      resetToken={returnState.get("token")}
      onResetComplete={() => setResetting(false)}
    />
  );
}
