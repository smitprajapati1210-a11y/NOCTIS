import { getMoonIllumination } from "suncalc";
import { dateOffset, timeMinutes, type Entry } from "./domain";

export const PHASE_NAMES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
] as const;
export function moonSnapshot(date: Date) {
  const moon = getMoonIllumination(date);
  return {
    ...moon,
    name: PHASE_NAMES[Math.round(moon.phase * 8) % 8],
    percent: Math.round(moon.fraction * 100),
  };
}
// Entries use the wake-up date. A bedtime later on the clock is on the preceding calendar day.
export function entryMoment(
  entry: Pick<Entry, "date" | "bedtime" | "wakeTime">,
): Date {
  const date =
    timeMinutes(entry.bedtime) > timeMinutes(entry.wakeTime)
      ? dateOffset(entry.date, -1)
      : entry.date;
  return new Date(`${date}T${entry.bedtime}:00`);
}
export const tonightMoment = (date: string): Date =>
  new Date(`${date}T21:00:00`);

// Project a lit sphere, retaining the actual illuminated area. Waxing lights the right;
// waning lights the left. Orientation is a northern-style diagram, not a horizon view.
export function illuminatedPath(fraction: number, waxing: boolean): string {
  const k = 1 - 2 * Math.max(0, Math.min(1, fraction));
  const side = waxing ? 1 : -1;
  const points: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const y = -1 + i / 32;
    points.push([
      50 + side * Math.sqrt(Math.max(0, 1 - y * y)) * 39,
      50 + y * 39,
    ]);
  }
  for (let i = 64; i >= 0; i--) {
    const y = -1 + i / 32;
    points.push([
      50 + side * k * Math.sqrt(Math.max(0, 1 - y * y)) * 39,
      50 + y * 39,
    ]);
  }
  return (
    points
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ") + " Z"
  );
}
