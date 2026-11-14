import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PREFERENCES,
  average,
  chartDays,
  clockTime,
  consistency,
  dateOffset,
  demoEntries,
  elapsed,
  entryError,
  greetingForHour,
  makePlan,
  patterns,
  recent,
  replyTo,
  sleepMinutes,
  weekEnding,
  type Entry,
} from "../src/domain";
import { freshStore, parseStore } from "../src/storage";

const night = (patch: Partial<Entry> = {}): Entry => ({
  id: "n1",
  date: "2026-10-31",
  bedtime: "23:00",
  wakeTime: "07:00",
  latency: 15,
  awake: 10,
  quality: 4,
  tags: [],
  note: "",
  ...patch,
});
test("weekly sleep charts start fresh on Mondays and greetings switch at local hour boundaries", () => {
  assert.equal(weekEnding("2026-11-01"), "2026-11-01");
  assert.equal(weekEnding("2026-11-02"), "2026-11-08");
  assert.equal(weekEnding("2026-12-31"), "2027-01-03");
  const nights = [
    night({ date: "2026-11-01" }),
    night({ id: "n2", date: "2026-11-02" }),
  ];
  const slots = chartDays(nights, 7, weekEnding("2026-11-02"));
  assert.equal(slots[0].entry?.id, "n2");
  assert.equal(slots.filter((slot) => slot.entry).length, 1);
  assert.deepEqual([4, 5, 11, 12, 17, 18].map(greetingForHour), [
    "Good Evening",
    "Good Morning",
    "Good Morning",
    "Good Afternoon",
    "Good Afternoon",
    "Good Evening",
  ]);
});

test("overnight sleep subtracts latency and awakenings; daytime sleep works", () => {
  assert.equal(elapsed(night()), 480);
  assert.equal(sleepMinutes(night()), 455);
  assert.equal(
    sleepMinutes(
      night({ bedtime: "09:00", wakeTime: "16:00", latency: 0, awake: 0 }),
    ),
    420,
  );
});
test("invalid, future, impossible and empty sleep entries are rejected", () => {
  const end = "2026-11-04";
  for (const patch of [
    { date: "2026-02-30" },
    { date: "2026-11-05" },
    { bedtime: "26:00" },
    { bedtime: "07:00" },
    { bedtime: "08:00" },
    { awake: 500 },
    { latency: -1 },
    { quality: 0 },
    { latency: 150, awake: 200, bedtime: "02:00" },
  ])
    assert.ok(entryError(night(patch), end), JSON.stringify(patch));
  assert.equal(entryError(night(), end), null);
});
test("chart windows cross month boundaries and preserve missing days", () => {
  const slots = chartDays([night()], 7, "2026-11-04");
  assert.equal(slots.length, 7);
  assert.equal(slots[0].date, "2026-10-29");
  assert.equal(slots.filter((s) => s.entry).length, 1);
  assert.equal(slots[2].entry?.id, "n1");
  assert.equal(
    recent([night(), night({ id: "old", date: "2026-10-01" })], 7, "2026-11-04")
      .length,
    1,
  );
  assert.equal(dateOffset("2026-03-01", -1), "2026-02-28");
  assert.equal(average([]), 0);
});
test("bedtime variation treats 23:50 and 00:10 as close neighbors", () => {
  assert.equal(consistency([night()]), null);
  assert.equal(
    consistency([
      night({ bedtime: "23:50" }),
      night({ bedtime: "00:10" }),
      night({ bedtime: "00:00" }),
    ]),
    8,
  );
});
test("planner fits the earlier of preferred wake and morning constraints", () => {
  const plan = makePlan({
    ...DEFAULT_PREFERENCES,
    eventTime: "08:00",
    prep: 60,
    travel: 30,
  });
  assert.equal(plan.wake, "06:30");
  assert.equal(plan.bed, "22:30");
  assert.equal(plan.wind, "22:00");
  assert.equal(plan.constrained, true);
  assert.equal(plan.bedPreviousDay, true);
  const dayPlan = makePlan({
    ...DEFAULT_PREFERENCES,
    wakeTime: "10:00",
    eventTime: "13:00",
  });
  assert.equal(dayPlan.bed, "02:00");
  assert.equal(dayPlan.bedPreviousDay, false);
  assert.equal(clockTime(-15), "23:45");
  assert.equal(clockTime(1450), "00:10");
});
test("patterns require three observations in both comparison groups", () => {
  const data = Array.from({ length: 6 }, (_, i) =>
    night({
      id: `n${i}`,
      date: dateOffset("2026-11-01", -i),
      bedtime: i < 3 ? "00:00" : "23:00",
      tags: i < 3 ? ["Late caffeine"] : [],
    }),
  );
  const pattern = patterns(data).find((p) => p.tag === "Late caffeine")!;
  assert.equal(pattern.ready, true);
  assert.equal(pattern.difference, -60);
  assert.equal(pattern.withCount, 3);
  assert.equal(pattern.withoutCount, 3);
  assert.equal(
    patterns(data.slice(1)).find((p) => p.tag === "Late caffeine")!.ready,
    false,
  );
});
test("backup validation round trips personal data and rejects duplicates atomically", () => {
  const state = freshStore();
  state.entries = [night()];
  state.preferences.demo = false;
  assert.deepEqual(parseStore(JSON.parse(JSON.stringify(state))), state);
  assert.throws(
    () => parseStore({ ...state, entries: [night(), night({ id: "other" })] }),
    /duplicate/,
  );
  assert.throws(() => parseStore({ ...state, version: 2 }), /supported/);
  assert.throws(
    () =>
      parseStore({
        ...state,
        entries: [night({ tags: ["unknown"] as never })],
      }),
    /incomplete/,
  );
  assert.throws(
    () =>
      parseStore({
        ...state,
        preferences: { ...state.preferences, goal: 100 },
      }),
    /preferences/,
  );
  assert.throws(() =>
    parseStore({
      ...state,
      entries: [
        {
          ...night(),
          note: "<script>safe as plain text</script>",
          quality: "4",
        },
      ],
    }),
  );
});
test("sample nights are valid, unique and never become personal entries", () => {
  const samples = demoEntries("2026-11-04");
  assert.equal(samples.length, 28);
  assert.equal(new Set(samples.map((e) => e.date)).size, 28);
  assert.equal(new Set(samples.map((e) => e.note)).size, 28);
  assert.ok(samples.every((e) => e.note.split(/\s+/).length >= 30));
  samples.forEach((e) => assert.equal(entryError(e, "2026-11-04"), null));
  assert.equal(freshStore().entries.length, 0);
});
test("local assistant handles empty journals, chart requests and medical boundaries", () => {
  assert.match(replyTo("How was my week?", [], 8).text, /one night/);
  assert.equal(replyTo("Show rested ratings", [night()], 8).chart, "quality");
  assert.equal(
    replyTo("Does caffeine show a pattern?", demoEntries(), 8).chart,
    "pattern",
  );
  assert.equal(
    replyTo("Does caffeine show a pattern?", demoEntries(), 8).tag,
    "Late caffeine",
  );
  assert.match(
    replyTo("What medication should I take?", [], 8).text,
    /cannot diagnose/,
  );
  assert.match(replyTo("Write a poem", [night()], 8).text, /local preview/);
});

test("after-midnight planning targets the upcoming morning, then advances after wake-up", async () => {
  const { nextPlan } = await import("../src/domain");
  const nightPlan = nextPlan(
    DEFAULT_PREFERENCES,
    new Date("2026-11-05T00:15:00"),
  );
  assert.equal(nightPlan.eventDate, "2026-11-05");
  assert.equal(nightPlan.wakeDate, "2026-11-05");
  assert.equal(nightPlan.bedDate, "2026-11-04");
  const dayPlan = nextPlan(
    DEFAULT_PREFERENCES,
    new Date("2026-11-05T13:00:00"),
  );
  assert.equal(dayPlan.eventDate, "2026-11-06");
  assert.equal(dayPlan.bedDate, "2026-11-05");
});

test("long wind-down sessions round trip; old backups preserve breathing and gain a separate session", () => {
  const state = freshStore();
  state.preferences.windDown = 20;
  state.windDownTimer = {
    duration: 2700,
    remaining: 2700,
    endAt: Date.now() + 2700000,
  };
  assert.deepEqual(
    parseStore(JSON.parse(JSON.stringify(state))).windDownTimer,
    state.windDownTimer,
  );
  const legacy = JSON.parse(JSON.stringify(state));
  delete legacy.windDownTimer;
  legacy.timer = { endAt: null, remaining: 60 };
  const restored = parseStore(legacy);
  assert.deepEqual(restored.windDownTimer, {
    endAt: null,
    remaining: 1200,
    duration: 1200,
  });
  assert.deepEqual(restored.timer, legacy.timer);
});
