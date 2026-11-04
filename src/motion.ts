import { flushSync } from "react-dom";

type Transition = {
  skipTransition: () => void;
  ready: Promise<void>;
  finished: Promise<void>;
};
let active: Transition | null = null;
let request = 0;

export function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Capture only the page viewport. The real dock remains live and glides in place. */
export function changePage(
  update: () => void,
  direction: "forward" | "backward" = "forward",
) {
  const current = ++request;
  active?.skipTransition();
  active = null;
  document.documentElement.dataset.direction = direction;
  if (reducedMotion() || typeof document.startViewTransition !== "function") {
    update();
    return;
  }
  try {
    const transition = document.startViewTransition(() => {
      // A skipped transition can still run its callback. A newer tap always wins.
      if (current === request) flushSync(update);
    });
    active = transition;
    void transition.ready.catch(() => {});
    void transition.finished
      .catch(() => {})
      .finally(() => {
        if (active === transition) active = null;
      });
  } catch {
    if (current === request) update();
  }
}
