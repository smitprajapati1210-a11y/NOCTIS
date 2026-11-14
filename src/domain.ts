export const TAGS = [
  "Late caffeine",
  "Screens in bed",
  "Movement",
  "Late meal",
  "High stress",
  "Reading",
] as const;
export type Tag = (typeof TAGS)[number];
export type Entry = {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  latency: number;
  awake: number;
  quality: number;
  tags: Tag[];
  note: string;
};
export type Preferences = {
  name: string;
  goal: number;
  demo: boolean;
  wakeTime: string;
  eventName: string;
  eventTime: string;
  prep: number;
  travel: number;
  windDown: number;
};
export type Store = {
  version: 1;
  entries: Entry[];
  preferences: Preferences;
  routine: { date: string; completed: string[] };
  timer: { endAt: number | null; remaining: number };
  windDownTimer: { endAt: number | null; remaining: number; duration: number };
};
export const DEFAULT_PREFERENCES: Preferences = {
  name: "",
  goal: 8,
  demo: false,
  wakeTime: "07:00",
  eventName: "First commitment",
  eventTime: "09:00",
  prep: 45,
  travel: 30,
  windDown: 30,
};
export const localDate = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function dateOffset(date: string, offset: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return localDate(d);
}
export const today = () => localDate();
export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", options);
}
export const timeMinutes = (s: string): number =>
  Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
export function clockTime(total: number): string {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;
}
export function timeLabel(time: string): string {
  const m = timeMinutes(time);
  return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "am" : "pm"}`;
}
export const elapsed = (e: Pick<Entry, "bedtime" | "wakeTime">): number =>
  (timeMinutes(e.wakeTime) - timeMinutes(e.bedtime) + 1440) % 1440;
export const sleepMinutes = (e: Entry): number =>
  Math.max(0, elapsed(e) - e.latency - e.awake);
export function durationLabel(minutes: number): string {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}
export const average = (values: number[]): number =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export const sorted = (entries: Entry[]): Entry[] =>
  [...entries].sort((a, b) => b.date.localeCompare(a.date));
export function recent(entries: Entry[], days: number, end = today()): Entry[] {
  const start = dateOffset(end, 1 - days);
  return sorted(entries.filter((e) => e.date >= start && e.date <= end));
}
export function chartDays(
  entries: Entry[],
  days = 7,
  end = today(),
): { date: string; entry?: Entry }[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  return Array.from({ length: days }, (_, i) => {
    const date = dateOffset(end, i + 1 - days);
    return { date, entry: byDate.get(date) };
  });
}
export function consistency(entries: Entry[]): number | null {
  if (entries.length < 3) return null;
  // Move the clock boundary to noon so 23:50 and 00:10 remain close together.
  const beds = entries.map((e) => (timeMinutes(e.bedtime) + 720) % 1440);
  const mean = average(beds);
  return Math.round(Math.sqrt(average(beds.map((x) => (x - mean) ** 2))));
}
export function entryError(e: Entry, end = today()): string | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
    !Number.isFinite(new Date(`${e.date}T12:00:00`).getTime()) ||
    localDate(new Date(`${e.date}T12:00:00`)) !== e.date
  )
    return "Choose a valid wake-up date.";
  if (e.date > end) return "Your wake-up date cannot be in the future.";
  if (
    ![e.bedtime, e.wakeTime].every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))
  )
    return "Choose both a bedtime and a wake-up time.";
  if (
    !Number.isInteger(e.latency) ||
    e.latency < 0 ||
    e.latency > 180 ||
    !Number.isInteger(e.awake) ||
    e.awake < 0 ||
    e.awake > 240
  )
    return "Use 0–180 minutes to fall asleep and 0–240 minutes awake.";
  if (elapsed(e) <= 0 || elapsed(e) > 960 || sleepMinutes(e) <= 0)
    return "Check your times. Time in bed must be at most 16 hours, with some time asleep.";
  if (!Number.isInteger(e.quality) || e.quality < 1 || e.quality > 5)
    return "Choose how rested you feel, from 1 to 5.";
  if (e.note.length > 2000) return "Keep your note under 2,000 characters.";
  if (!e.tags.every((t) => TAGS.includes(t)))
    return "One of the selected habits is not supported.";
  return null;
}
export type Pattern = {
  tag: Tag;
  withCount: number;
  withoutCount: number;
  withMean: number;
  withoutMean: number;
  difference: number;
  ready: boolean;
};
export function patterns(entries: Entry[]): Pattern[] {
  return TAGS.map((tag) => {
    const withTag = entries.filter((e) => e.tags.includes(tag));
    const withoutTag = entries.filter((e) => !e.tags.includes(tag));
    const withMean = average(withTag.map(sleepMinutes));
    const withoutMean = average(withoutTag.map(sleepMinutes));
    return {
      tag,
      withCount: withTag.length,
      withoutCount: withoutTag.length,
      withMean,
      withoutMean,
      difference: withMean - withoutMean,
      ready: withTag.length >= 3 && withoutTag.length >= 3,
    };
  }).sort(
    (a, b) =>
      Number(b.ready) - Number(a.ready) ||
      Math.abs(b.difference) - Math.abs(a.difference),
  );
}
export function makePlan(p: Preferences): {
  wake: string;
  bed: string;
  wind: string;
  departure: string;
  constrained: boolean;
  bedPreviousDay: boolean;
  windPreviousDay: boolean;
} {
  const event = timeMinutes(p.eventTime);
  // Planner is for tomorrow's daytime commitment; negative values correctly cross midnight.
  const latestWake = event - p.prep - p.travel;
  const wake = Math.min(timeMinutes(p.wakeTime), latestWake);
  const bed = wake - Math.round(p.goal * 60);
  const wind = bed - p.windDown;
  return {
    wake: clockTime(wake),
    bed: clockTime(bed),
    wind: clockTime(wind),
    departure: clockTime(event - p.travel),
    constrained: wake < timeMinutes(p.wakeTime),
    bedPreviousDay: bed < 0,
    windPreviousDay: wind < 0,
  };
}
export function demoEntries(end = today()): Entry[] {
  return Array.from({ length: 28 }, (_, i) => {
    const late = i % 4 === 0 || i % 7 === 2;
    const movement = i % 3 !== 1;
    const bed = late ? 45 + (i % 3) * 12 : 23 * 60 + (i % 4) * 9;
    const tags: Tag[] = [
      ...(late
        ? ["Late caffeine" as const, "Screens in bed" as const]
        : ["Reading" as const]),
      ...(movement ? ["Movement" as const] : []),
      ...(i % 5 === 0 ? ["High stress" as const] : []),
    ];
    return {
      id: `sample-${i}`,
      date: dateOffset(end, -i),
      bedtime: clockTime(bed),
      wakeTime: clockTime(7 * 60 + 20 + (i % 3) * 12),
      latency: late ? 25 : 10,
      awake: (i % 3) * 5,
      quality: late ? 2 + (i % 2) : 4 + (i % 2),
      tags,
      note: late
        ? "A busy evening. Took a little longer to settle."
        : "Read a few pages, then put the day away.",
    };
  });
}
export type ChatReply = {
  text: string;
  chart?: "duration" | "quality" | "pattern";
  tag?: Tag;
};
export function replyTo(
  question: string,
  entries: Entry[],
  goal: number,
): ChatReply {
  const q = question.toLowerCase();
  const week = recent(entries, 7);
  const month = recent(entries, 30);
  if (/diagnos|medic|pill|apnea|insomnia|melatonin/.test(q))
    return {
      text: "I can help reflect on your journal, but I cannot diagnose a sleep condition or recommend medication. A qualified clinician can help with persistent sleep concerns.",
    };
  if (!entries.length)
    return {
      text: "Your story starts with one night. Log your bedtime, wake-up time and how rested you feel. I can then summarize your entries and build a chart.",
    };
  if (
    /caffeine|coffee|habit|pattern|screen|movement|reading|stress|meal/.test(q)
  ) {
    const requested = patterns(month).find(
      (p) =>
        q.includes(p.tag.toLowerCase().split(" ").at(-1)!) ||
        (p.tag === "Late caffeine" && /coffee|caffeine/.test(q)) ||
        (p.tag === "Screens in bed" && /screen/.test(q)),
    );
    const p = requested ?? patterns(month).find((x) => x.ready);
    if (!p?.ready)
      return {
        text: `There isn't enough comparison data yet. Log at least 3 nights with ${p?.tag.toLowerCase() ?? "a habit"} and 3 without it. Missing tags count as “not tagged,” not proof that a habit was absent.`,
        chart: "pattern",
      };
    return {
      text: `In the last 30 days, nights tagged “${p.tag}” averaged ${durationLabel(p.withMean)} (${p.withCount} nights), compared with ${durationLabel(p.withoutMean)} on ${p.withoutCount} untagged nights. That's ${Math.round(Math.abs(p.difference))} minutes ${p.difference >= 0 ? "more" : "less"}. This is an association in your notes, not evidence of cause.`,
      chart: "pattern",
      tag: p.tag,
    };
  }
  if (/rested|quality|feel/.test(q))
    return {
      text: week.length
        ? `Your average rested rating is ${average(week.map((e) => e.quality)).toFixed(1)} out of 5 across ${week.length} logged nights this week. This is your own rating, not a measured sleep score.`
        : "No nights are logged in the past 7 days. Your older entries are still in the journal.",
      chart: "quality",
    };
  if (/week|sleep|trend|long|summary|duration/.test(q))
    return {
      text: week.length
        ? `You averaged ${durationLabel(average(week.map(sleepMinutes)))} across ${week.length} logged nights in the past 7 days. ${week.filter((e) => sleepMinutes(e) >= goal * 60).length} met your ${goal}-hour goal. Missing nights are excluded from the average.`
        : "There are no logs in the past 7 days. Add a recent night to start your weekly chart.",
      chart: "duration",
    };
  return {
    text: "In this local preview I can summarize your week, chart your rested ratings, or compare tagged habits. Try “How was my week?” or “Does late caffeine show a pattern?”",
  };
}

/** Choose the next planned wake-up, so opening at 1 am plans for this morning. */
export function nextPlan(p: Preferences, now = new Date()) {
  const plan = makePlan(p);
  const rawWake = Math.min(
    timeMinutes(p.wakeTime),
    timeMinutes(p.eventTime) - p.prep - p.travel,
  );
  const at = (date: string, minutes: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setMinutes(minutes);
    return d;
  };
  let eventDate = localDate(now);
  for (let i = 0; i < 3; i++) {
    eventDate = dateOffset(localDate(now), i);
    if (at(eventDate, rawWake).getTime() > now.getTime()) break;
  }
  const windMoment = at(
    eventDate,
    rawWake - Math.round(p.goal * 60) - p.windDown,
  );
  return {
    ...plan,
    eventDate,
    wakeDate: localDate(at(eventDate, rawWake)),
    bedDate: localDate(at(eventDate, rawWake - Math.round(p.goal * 60))),
    windDate: localDate(windMoment),
    windMoment,
  };
}
