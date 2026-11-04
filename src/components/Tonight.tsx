import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Moon,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import NightMoon from "./Moon";
import { WindDownSession } from "./WindDown";
import type { WindDownController } from "../useWindDown";
import { tonightMoment } from "../moon";
import {
  dateLabel,
  nextPlan,
  timeLabel,
  today,
  type Preferences,
  type Store,
} from "../domain";

export default function Tonight({
  store,
  setStore,
  notify,
  windDown,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  notify: (s: string) => void;
  windDown: WindDownController;
}) {
  const [editPlan, setEditPlan] = useState(false);
  const [draft, setDraft] = useState(store.preferences);
  const p = store.preferences;
  const plan = nextPlan(p);
  const [now, setNow] = useState(Date.now());
  const [timerLength, setTimerLength] = useState(store.timer.remaining || 180);
  const remaining =
    store.timer.endAt === null
      ? store.timer.remaining
      : Math.max(0, Math.ceil((store.timer.endAt - now) / 1000));
  const running = store.timer.endAt !== null;
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setNow(Date.now());
      if (store.timer.endAt! <= Date.now()) {
        setStore((s) => ({ ...s, timer: { endAt: null, remaining: 0 } }));
        notify("A little space, just for you. Your timer is complete.");
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [running, store.timer.endAt, setStore, notify]);
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setDraft((s) => ({ ...s, [key]: value }));
  function savePlan(e: FormEvent) {
    e.preventDefault();
    setStore((s) => ({ ...s, preferences: draft }));
    setEditPlan(false);
    notify("Your evening plan is updated.");
  }
  const setTimer = (seconds: number) => {
    setTimerLength(seconds);
    setStore((s) => ({ ...s, timer: { endAt: null, remaining: seconds } }));
  };
  return (
    <div className="view tonight-view wind-down-view">
      <div className="wind-down-intro">
        <h1>Wind down.</h1>
        <p>Make a little room for rest.</p>
      </div>
      <WindDownSession store={store} setStore={setStore} timer={windDown} />
      <section className="plan-card">
        <div className="section-heading">
          <div className="mini-label">
            <span className="status-dot" />
            YOUR EVENING PLAN
          </div>
          <span className="small">
            For {dateLabel(plan.eventDate, { weekday: "short" })}
          </span>
        </div>
        <div className="plan-time">
          <div>
            <span>Start winding down</span>
            <strong>{timeLabel(plan.wind)}</strong>
          </div>
          <Moon size={36} strokeWidth={1.1} />
        </div>
        <div className="plan-stops">
          <div>
            <span className="timeline-dot" />
            <span>
              In bed ·{" "}
              {plan.bedDate === today()
                ? "today"
                : plan.bedDate < today()
                  ? "last night"
                  : "tomorrow"}
            </span>
            <strong>{timeLabel(plan.bed)}</strong>
          </div>
          <div>
            <span className="timeline-dot" />
            <span>Wake up</span>
            <strong>{timeLabel(plan.wake)}</strong>
          </div>
          <div>
            <span className="timeline-dot" />
            <span>{p.eventName || "First commitment"}</span>
            <strong>{timeLabel(p.eventTime)}</strong>
          </div>
        </div>
        <p className="plan-explain">
          {p.goal}h in bed · {p.prep}m to get ready · {p.travel}m travel
          {plan.constrained
            ? ". Wake-up moved earlier to fit your morning."
            : ""}
        </p>
        <button
          className="plan-edit"
          onClick={() => {
            setDraft(p);
            setEditPlan(!editPlan);
          }}
        >
          Adjust my schedule
          <ChevronDown size={16} className={editPlan ? "rotate" : ""} />
        </button>
      </section>
      {editPlan && (
        <form className="card schedule-form" onSubmit={savePlan}>
          <h3>Make room for tomorrow</h3>
          <p className="muted small">
            Set your next morning commitment. NOCTIS works backward from it.
          </p>
          <label className="field">
            Commitment name
            <input
              maxLength={60}
              value={draft.eventName}
              onChange={(e) => update("eventName", e.target.value)}
              placeholder="Class, work, an early start…"
            />
          </label>
          <div className="field-grid">
            <label className="field">
              Starts at
              <input
                type="time"
                required
                value={draft.eventTime}
                onChange={(e) => update("eventTime", e.target.value)}
              />
            </label>
            <label className="field">
              Preferred wake-up
              <input
                type="time"
                required
                value={draft.wakeTime}
                onChange={(e) => update("wakeTime", e.target.value)}
              />
            </label>
          </div>
          <div className="field-grid">
            <label className="field">
              Getting ready (min)
              <input
                type="number"
                min="0"
                max="180"
                required
                value={draft.prep}
                onChange={(e) => update("prep", Number(e.target.value))}
              />
            </label>
            <label className="field">
              Travel (min)
              <input
                type="number"
                min="0"
                max="180"
                required
                value={draft.travel}
                onChange={(e) => update("travel", Number(e.target.value))}
              />
            </label>
          </div>
          <label className="field">
            Wind-down time (min)
            <input
              type="number"
              min="5"
              max="120"
              required
              value={draft.windDown}
              onChange={(e) => update("windDown", Number(e.target.value))}
            />
          </label>
          <button className="primary full" type="submit">
            Update tonight’s plan
            <ArrowRight size={17} />
          </button>
        </form>
      )}
      <p className="caption plan-caption">
        This is a time-in-bed plan, not a prediction of sleep.{" "}
        {plan.windMoment.getTime() < Date.now()
          ? "Your planned wind-down time has passed. You can still take a short pause."
          : plan.windDate === today()
            ? "Wind-down starts today."
            : "Wind-down starts tomorrow."}{" "}
        No alarm or notification is set.
      </p>
      <details className="wind-breathing">
        <summary>
          A short breathing pause <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <section className="card breathing-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A QUIET MINUTE</p>
              <h3>Come back to your breath</h3>
            </div>
            <span className="icon-tile">
              <Clock3 size={19} />
            </span>
          </div>
          <p className="muted small">
            An optional gentle rhythm. Breathe comfortably.
          </p>
          <div className={`breath-orbit ${running ? "running" : ""}`}>
            <div className="breath-ring">
              <span className="timer-number" aria-live="off">
                {Math.floor(remaining / 60)}:
                {String(remaining % 60).padStart(2, "0")}
              </span>
              <span>
                {running
                  ? "Breathe at your pace"
                  : remaining === 0
                    ? "A little more at ease."
                    : "A moment, just for you"}
              </span>
            </div>
          </div>
          <div className="timer-options" aria-label="Timer duration">
            {[60, 180, 300].map((sec) => (
              <button
                key={sec}
                className={timerLength === sec ? "active" : ""}
                onClick={() => setTimer(sec)}
                disabled={running}
              >
                {sec / 60} min
              </button>
            ))}
          </div>
          <div className="timer-controls">
            <button
              className="icon-button"
              aria-label="Reset timer"
              onClick={() => setTimer(timerLength)}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="primary"
              onClick={() => {
                const current = store.timer.endAt
                  ? Math.max(
                      0,
                      Math.ceil((store.timer.endAt - Date.now()) / 1000),
                    )
                  : remaining;
                setNow(Date.now());
                setStore((s) => ({
                  ...s,
                  timer: running
                    ? { endAt: null, remaining: current }
                    : {
                        endAt: Date.now() + (remaining || timerLength) * 1000,
                        remaining: remaining || timerLength,
                      },
                }));
              }}
            >
              {running ? (
                <Pause size={16} />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              {running
                ? "Pause"
                : remaining === 0
                  ? "Begin again"
                  : "Begin a pause"}
            </button>
          </div>
          <p className="caption">
            The timer keeps time if you switch views. Keep the app open to see
            it finish.
          </p>
        </section>
      </details>
      <NightMoon date={tonightMoment(today())} tonight />
      <div className="closing-note">
        <span>✦</span>
        <p>You don’t have to earn your rest.</p>
      </div>
    </div>
  );
}
