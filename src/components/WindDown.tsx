import type { Dispatch, SetStateAction } from "react";
import {
  BookOpen,
  Check,
  Pencil,
  Clock3,
  ListTodo,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Sunrise,
} from "lucide-react";
import { routineCompletedToday, today, type Store } from "../domain";
import type { WindDownController } from "../useWindDown";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const taskIcons = new Map([
  ["lights", Moon],
  ["phone", Smartphone],
  ["tomorrow", BookOpen],
  ["reflect", Sunrise],
]);

export function WindDownHome({
  store,
  timer,
  day,
  onOpen,
}: {
  store: Store;
  timer: WindDownController;
  day: string;
  onOpen: () => void;
}) {
  const done = routineCompletedToday(store.routine, day).length;
  const total = store.routine.tasks.length;
  return (
    <button
      className="today-wind"
      onClick={onOpen}
      aria-label="Open wind-down timer and checklist"
    >
      <Moon size={19} aria-hidden="true" />
      <span>
        <strong>Wind down</strong>
        <small>
          {timer.running && (
            <span className="today-timer">{clock(timer.remaining)} left</span>
          )}
          {total
            ? `${done} of ${total} rituals complete`
            : "Set up your checklist"}
        </small>
      </span>
    </button>
  );
}

export function WindDownSession({
  store,
  setStore,
  timer,
  day,
  onEdit,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  timer: WindDownController;
  day: string;
  onEdit: () => void;
}) {
  const { tasks } = store.routine;
  const done = routineCompletedToday(store.routine, day);
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
              ? "Running"
              : timer.remaining === 0
                ? "Complete"
                : paused
                  ? "Paused"
                  : ""}
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
          <button className="wind-edit" onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" />{" "}
            {tasks.length ? "Edit" : "Add tasks"}
          </button>
        </div>
        {tasks.length > 0 ? (
          <>
            <div className="wind-checklist-status">
              <span>
                {done.length} of {tasks.length} done
              </span>
              <div
                className="wind-progress"
                role="progressbar"
                aria-label="Wind-down checklist progress"
                aria-valuemin={0}
                aria-valuemax={tasks.length}
                aria-valuenow={done.length}
              >
                <span
                  style={{ transform: `scaleX(${done.length / tasks.length})` }}
                />
              </div>
            </div>
            <div className="wind-rituals">
              {tasks.map(({ id, title }) => {
                const Icon = taskIcons.get(id) ?? ListTodo;
                return (
                  <label
                    key={id}
                    className={`wind-ritual ${done.includes(id) ? "is-done" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={done.includes(id)}
                      onChange={() =>
                        setStore((previous) => {
                          const date = today();
                          const current = routineCompletedToday(
                            previous.routine,
                            date,
                          );
                          const completed = current.includes(id)
                            ? current.filter((item) => item !== id)
                            : [...current, id];
                          return {
                            ...previous,
                            routine: { ...previous.routine, date, completed },
                          };
                        })
                      }
                    />
                    <Icon
                      className="wind-ritual-icon"
                      size={18}
                      aria-hidden="true"
                    />
                    <span className="wind-ritual-copy">{title}</span>
                    <span className="wind-check" aria-hidden="true">
                      <Check size={13} />
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        ) : (
          <p className="wind-empty">
            Add a task to build your evening routine.
          </p>
        )}
      </div>
    </section>
  );
}
