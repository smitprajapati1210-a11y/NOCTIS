import {
  DEFAULT_PREFERENCES,
  DEFAULT_WIND_DOWN_TASKS,
  WIND_DOWN_TASK_LIMIT,
  WIND_DOWN_TITLE_LIMIT,
  entryError,
  TAGS,
  today,
  type Entry,
  type Store,
} from "./domain";

export const STORAGE_KEY = "noctis.journal.v1";
export const accountStorageKey = (accountId: string) =>
  `${STORAGE_KEY}.account.${encodeURIComponent(accountId)}`;
export const freshStore = (): Store => ({
  version: 1,
  entries: [],
  preferences: { ...DEFAULT_PREFERENCES },
  routine: {
    date: today(),
    completed: [],
    tasks: DEFAULT_WIND_DOWN_TASKS.map((task) => ({ ...task })),
  },
  timer: { endAt: null, remaining: 180 },
  windDownTimer: {
    endAt: null,
    remaining: DEFAULT_PREFERENCES.windDown * 60,
    duration: DEFAULT_PREFERENCES.windDown * 60,
  },
});
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const bounded = (n: unknown, min: number, max: number): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;

export function parseStore(value: unknown): Store {
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.entries) ||
    value.entries.length > 5000 ||
    !object(value.preferences)
  )
    throw new Error("This is not a supported NOCTIS backup (version 1).");
  const ids = new Set<string>();
  const dates = new Set<string>();
  const entries = value.entries.map((item: unknown) => {
    if (
      !object(item) ||
      typeof item.id !== "string" ||
      !item.id ||
      item.id.length > 100 ||
      typeof item.date !== "string" ||
      typeof item.bedtime !== "string" ||
      typeof item.wakeTime !== "string" ||
      typeof item.note !== "string" ||
      !Array.isArray(item.tags) ||
      !item.tags.every(
        (t) =>
          typeof t === "string" && TAGS.includes(t as (typeof TAGS)[number]),
      )
    )
      throw new Error(
        "A journal entry is incomplete. Nothing has been imported.",
      );
    const e = item as unknown as Entry;
    const error = entryError(e);
    if (error) throw new Error(error);
    if (ids.has(e.id) || dates.has(e.date))
      throw new Error(
        "The backup has duplicate nights. Nothing has been imported.",
      );
    ids.add(e.id);
    dates.add(e.date);
    return {
      id: e.id,
      date: e.date,
      bedtime: e.bedtime,
      wakeTime: e.wakeTime,
      latency: e.latency,
      awake: e.awake,
      quality: e.quality,
      tags: [...new Set(e.tags)],
      note: e.note,
    };
  });
  const p = value.preferences;
  if (
    typeof p.name !== "string" ||
    p.name.length > 40 ||
    typeof p.demo !== "boolean" ||
    !bounded(p.goal, 6, 10) ||
    !Number.isInteger(p.goal * 4) ||
    ![p.wakeTime, p.eventTime].every(
      (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t),
    ) ||
    typeof p.eventName !== "string" ||
    p.eventName.length > 60 ||
    !bounded(p.prep, 0, 180) ||
    !bounded(p.travel, 0, 180) ||
    !bounded(p.windDown, 5, 120) ||
    ![p.prep, p.travel, p.windDown].every(Number.isInteger)
  )
    throw new Error(
      "The backup preferences are invalid. Nothing has been imported.",
    );
  const store = freshStore();
  store.entries = entries;
  store.preferences = {
    name: p.name,
    goal: p.goal,
    demo: p.demo,
    wakeTime: p.wakeTime as string,
    eventTime: p.eventTime as string,
    eventName: p.eventName,
    prep: p.prep,
    travel: p.travel,
    windDown: p.windDown,
  };
  if (object(value.routine)) {
    const routine = value.routine;
    if (routine.tasks !== undefined) {
      if (
        !Array.isArray(routine.tasks) ||
        routine.tasks.length > WIND_DOWN_TASK_LIMIT
      )
        throw new Error("The backup has an invalid wind-down checklist.");
      const taskIds = new Set<string>();
      const titles = new Set<string>();
      store.routine.tasks = routine.tasks.map((task: unknown) => {
        if (
          !object(task) ||
          typeof task.id !== "string" ||
          !/^[a-zA-Z0-9_-]{1,64}$/.test(task.id) ||
          taskIds.has(task.id) ||
          typeof task.title !== "string" ||
          !task.title.trim() ||
          task.title.length > WIND_DOWN_TITLE_LIMIT ||
          titles.has(task.title.trim().toLowerCase())
        )
          throw new Error("The backup has an invalid wind-down task.");
        taskIds.add(task.id);
        titles.add(task.title.trim().toLowerCase());
        return { id: task.id, title: task.title.trim() };
      });
    }
    if (typeof routine.date === "string" && Array.isArray(routine.completed)) {
      const taskIds = new Set(store.routine.tasks.map((task) => task.id));
      store.routine.date = routine.date;
      store.routine.completed = [
        ...new Set(
          routine.completed.filter(
            (id): id is string => typeof id === "string" && taskIds.has(id),
          ),
        ),
      ];
    }
  }
  if (
    object(value.timer) &&
    (value.timer.endAt === null ||
      bounded(value.timer.endAt, 0, Date.now() + 600000)) &&
    bounded(value.timer.remaining, 0, 600)
  )
    store.timer = {
      endAt: value.timer.endAt as number | null,
      remaining: value.timer.remaining,
    };
  // Older backups have only the short breathing timer. Keep it untouched and
  // initialize the new wind-down session from the user's planning preference.
  const session = value.windDownTimer;
  const duration = p.windDown * 60;
  store.windDownTimer = { endAt: null, remaining: duration, duration };
  if (
    object(session) &&
    bounded(session.duration, 60, 7200) &&
    Number.isInteger(session.duration) &&
    bounded(session.remaining, 0, session.duration) &&
    Number.isInteger(session.remaining) &&
    (session.endAt === null ||
      bounded(session.endAt, 0, Date.now() + session.duration * 1000))
  )
    store.windDownTimer = {
      endAt: session.endAt as number | null,
      remaining: session.remaining,
      duration: session.duration,
    };
  return store;
}

export function readStore(key = STORAGE_KEY): { store: Store; error: string } {
  try {
    const saved = localStorage.getItem(key);
    return {
      store: saved ? parseStore(JSON.parse(saved)) : freshStore(),
      error: "",
    };
  } catch {
    return {
      store: freshStore(),
      error:
        "Your saved data could not be opened. It has not been overwritten. Download the stored copy in Settings before resetting storage.",
    };
  }
}

export function downloadJson(data: unknown, name: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
