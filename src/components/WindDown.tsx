import type { Dispatch, SetStateAction } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Sunrise,
} from "lucide-react";
import { today, type Store } from "../domain";
import type { WindDownController } from "../useWindDown";

const rituals = [
  {
    id: "lights",
    title: "Soften the room",
    note: "Dim the lights. Make a little space.",
    icon: Moon,
  },
  {
    id: "phone",
    title: "Put the scroll to bed",
    note: "Let the next thing wait until tomorrow.",
    icon: Smartphone,
  },
  {
    id: "tomorrow",
    title: "Set tomorrow down",
    note: "Write one thing you want to remember.",
    icon: BookOpen,
  },
  {
    id: "reflect",
    title: "Find one good thing",
    note: "Small moments count, too.",
    icon: Sunrise,
  },
];
const doneToday = (store: Store) =>
  store.routine.date === today()
    ? rituals
        .filter(({ id }) => store.routine.completed.includes(id))
        .map(({ id }) => id)
    : [];
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function WindDownHome({
  store,
  timer,
  onOpen,
}: {
  store: Store;
  timer: WindDownController;
  onOpen: () => void;
}) {
  const done = doneToday(store).length;
  return (
    <button
      className={`wind-home ${timer.running ? "is-running" : ""}`}
      onClick={onOpen}
      aria-label="Open wind-down timer and checklist"
    >
      <span className="wind-home-top">
        <span className="wind-home-title">
          <Moon size={17} aria-hidden="true" /> Wind down
        </span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </span>
      <span className="wind-home-body">
        <span>
          <strong>Timer + checklist</strong>
          <small>
            {done} of {rituals.length} rituals complete
          </small>
        </span>
        <span className="wind-home-clock">
          <strong>{clock(timer.remaining)}</strong>
          <small>
            {timer.running
              ? "in progress"
              : timer.remaining === 0
                ? "timer complete"
                : timer.remaining < timer.duration
                  ? "paused"
                  : "take your time"}
          </small>
        </span>
      </span>
      <span className="wind-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${done / rituals.length})` }} />
      </span>
    </button>
  );
}

export function WindDownSession({
  store,
  setStore,
  timer,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  timer: WindDownController;
}) {
  const done = doneToday(store);
  const options = [...new Set([900, 1800, 2700, timer.duration])].sort(
    (a, b) => a - b,
  );
  const paused =
    !timer.running && timer.remaining > 0 && timer.remaining < timer.duration;
  const action = timer.running
    ? "Pause wind-down"
    : timer.remaining === 0
      ? "Start again"
      : paused
        ? "Resume wind-down"
        : "Start wind-down";
  return (
    <section
      className="wind-session"
      aria-label="Wind-down timer and checklist"
    >
      <div className="wind-timer-panel">
        <div className="wind-timer-top">
          <div>
            <p className="wind-timer-label">
              <Clock3 size={14} aria-hidden="true" /> WIND-DOWN TIMER
            </p>
            <div
              className="wind-countdown"
              role="timer"
              aria-label="Wind-down time remaining"
              aria-live="off"
            >
              {clock(timer.remaining)}
            </div>
          </div>
          <div className="wind-timer-actions">
            <button className="wind-start" onClick={timer.toggle}>
              {timer.running ? (
                <Pause size={15} aria-hidden="true" />
              ) : (
                <Play size={15} fill="currentColor" aria-hidden="true" />
              )}
              {action}
            </button>
          </div>
        </div>
        <div
          className="wind-durations"
          role="group"
          aria-label="Wind-down duration"
        >
          {options.map((seconds) => (
            <button
              key={seconds}
              disabled={timer.running}
              aria-pressed={timer.duration === seconds}
              onClick={() => timer.setDuration(seconds)}
            >
              {seconds / 60} min
            </button>
          ))}
        </div>
        <div className="wind-timer-footer">
          <p className="wind-timer-note" role="status">
            {timer.running
              ? "Your timer keeps going as you move around NOCTIS."
              : timer.remaining === 0
                ? "Your time is yours again. Finish your rituals at your pace."
                : paused
                  ? "Paused. Pick up whenever you’re ready."
                  : "A little room between your day and your night."}
          </p>
          <button
            className="wind-reset"
            aria-label="Reset wind-down timer"
            onClick={timer.reset}
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="wind-checklist">
        <div className="wind-checklist-heading">
          <h2>Your wind-down checklist</h2>
          <span>
            {done.length}/{rituals.length}
          </span>
        </div>
        <div
          className="wind-progress"
          role="progressbar"
          aria-label="Wind-down checklist progress"
          aria-valuemin={0}
          aria-valuemax={rituals.length}
          aria-valuenow={done.length}
        >
          <span
            style={{ transform: `scaleX(${done.length / rituals.length})` }}
          />
        </div>
        <div className="wind-rituals">
          {rituals.map(({ id, title, note, icon: Icon }) => (
            <label
              key={id}
              className={`wind-ritual ${done.includes(id) ? "is-done" : ""}`}
            >
              <input
                type="checkbox"
                checked={done.includes(id)}
                onChange={() =>
                  setStore((s) => {
                    const current =
                      s.routine.date === today() ? s.routine.completed : [];
                    return {
                      ...s,
                      routine: {
                        date: today(),
                        completed: current.includes(id)
                          ? current.filter((item) => item !== id)
                          : [...current, id],
                      },
                    };
                  })
                }
              />
              <span className="wind-ritual-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="wind-ritual-copy">
                <strong>{title}</strong>
                <small>{note}</small>
              </span>
              <span className="wind-check" aria-hidden="true">
                <Check size={13} />
              </span>
            </label>
          ))}
        </div>
        {done.length === rituals.length && (
          <p className="wind-checklist-done" role="status">
            A little less to carry into the night.
          </p>
        )}
      </div>
    </section>
  );
}
