import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Store } from "./domain";

export type WindDownController = {
  remaining: number;
  duration: number;
  running: boolean;
  setDuration: (seconds: number) => void;
  toggle: () => void;
  reset: () => void;
};

export function useWindDown(
  store: Store,
  setStore: Dispatch<SetStateAction<Store>>,
  notify: (message: string) => void,
): WindDownController {
  const timer = store.windDownTimer;
  const [now, setNow] = useState(Date.now());
  const announced = useRef<number | null>(null);
  useEffect(() => {
    const deadline = timer.endAt;
    if (deadline === null) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline && announced.current !== deadline) {
        announced.current = deadline;
        setStore((s) =>
          s.windDownTimer.endAt === deadline
            ? {
                ...s,
                windDownTimer: {
                  ...s.windDownTimer,
                  endAt: null,
                  remaining: 0,
                },
              }
            : s,
        );
        notify("Your wind-down timer is complete. Rest at your own pace.");
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pageshow", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [timer.endAt, setStore, notify]);
  return {
    duration: timer.duration,
    remaining:
      timer.endAt === null
        ? timer.remaining
        : Math.max(0, Math.ceil((timer.endAt - now) / 1000)),
    running: timer.endAt !== null,
    setDuration: (seconds) => {
      if (
        timer.endAt !== null ||
        !Number.isInteger(seconds) ||
        seconds < 60 ||
        seconds > 7200
      )
        return;
      setStore((s) => ({
        ...s,
        windDownTimer: { endAt: null, remaining: seconds, duration: seconds },
      }));
    },
    toggle: () => {
      const time = Date.now();
      setNow(time);
      setStore((s) => {
        const t = s.windDownTimer;
        return {
          ...s,
          windDownTimer:
            t.endAt !== null
              ? {
                  ...t,
                  endAt: null,
                  remaining: Math.max(0, Math.ceil((t.endAt - time) / 1000)),
                }
              : {
                  ...t,
                  endAt: time + (t.remaining || t.duration) * 1000,
                  remaining: t.remaining || t.duration,
                },
        };
      });
    },
    reset: () =>
      setStore((s) => ({
        ...s,
        windDownTimer: {
          ...s.windDownTimer,
          endAt: null,
          remaining: s.windDownTimer.duration,
        },
      })),
  };
}
