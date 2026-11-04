import { test } from "node:test";
import assert from "node:assert/strict";
import {
  entryMoment,
  illuminatedPath,
  moonSnapshot,
  tonightMoment,
} from "../src/moon";
import { localDate } from "../src/domain";

test("moon phase changes with the actual night and stays within physical bounds", () => {
  const samples = Array.from({ length: 30 }, (_, i) =>
    moonSnapshot(new Date(Date.UTC(2026, 10, i + 1, 15))),
  );
  samples.forEach((m) => {
    assert.ok(m.fraction >= 0 && m.fraction <= 1);
    assert.ok(m.phase >= 0 && m.phase <= 1);
    assert.ok(m.name);
  });
  assert.ok(Math.max(...samples.map((m) => m.fraction)) > 0.99);
  assert.ok(Math.min(...samples.map((m) => m.fraction)) < 0.02);
  assert.notEqual(samples[0].name, samples[14].name);
});
test("historical moon uses actual bedtime date, including an after-midnight bedtime", () => {
  const before = entryMoment({
    date: "2026-11-04",
    bedtime: "23:00",
    wakeTime: "07:00",
  });
  assert.equal(localDate(before), "2026-11-03");
  assert.equal(before.getHours(), 23);
  const after = entryMoment({
    date: "2026-11-04",
    bedtime: "01:30",
    wakeTime: "07:00",
  });
  assert.equal(localDate(after), "2026-11-04");
  assert.equal(after.getHours(), 1);
  const tonight = tonightMoment("2026-11-04");
  assert.equal(tonight.getHours(), 21);
  assert.equal(localDate(tonight), "2026-11-04");
});
test("moon illustration produces valid paths for new, quarter and full moon", () => {
  for (const fraction of [0, 0.25, 0.5, 0.75, 1])
    for (const waxing of [true, false]) {
      const path = illuminatedPath(fraction, waxing);
      assert.ok(path.startsWith("M"));
      assert.ok(path.endsWith(" Z"));
      assert.ok(!path.includes("NaN"));
    }
  assert.notEqual(illuminatedPath(0.25, true), illuminatedPath(0.25, false));
});
