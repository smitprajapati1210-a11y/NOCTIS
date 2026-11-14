import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://noctis.test",
  pretendToBeVisual: true,
});
const globals = dom.window as unknown as Record<string, unknown>;
for (const name of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "MutationObserver",
  "localStorage",
  "getComputedStyle",
])
  Object.defineProperty(globalThis, name, {
    value: name === "window" ? dom.window : globals[name],
    configurable: true,
  });
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  configurable: true,
  writable: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const { render, screen, cleanup, fireEvent, waitFor, within } =
  await import("@testing-library/react");
const { default: userEvent } = await import("@testing-library/user-event");
const { default: App } = await import("../src/App");
const { STORAGE_KEY, freshStore } = await import("../src/storage");
const { today } = await import("../src/domain");
const user = () => userEvent.setup({ document: dom.window.document });
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
function enableSampleFixture() {
  const state = freshStore();
  state.preferences.demo = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
afterEach(() => {
  cleanup();
  localStorage.clear();
});

async function logNight(
  note = "A test night, only in the isolated test environment.",
) {
  const u = user();
  await u.click(screen.getByRole("button", { name: /Log (a|my first) night/ }));
  fireEvent.change(screen.getByLabelText(/A thought from the night/), {
    target: { value: note },
  });
  await u.click(screen.getByRole("button", { name: "Reading" }));
  await u.click(screen.getByRole("button", { name: "Save my night" }));
  return u;
}

test("saving a real night exits samples; edit survives a remount; duplicate date is blocked", async () => {
  enableSampleFixture();
  render(<App />);
  assert.ok(screen.getByText("Exploring sample nights"));
  const u = await logNight();
  assert.equal(saved().entries.length, 1);
  assert.equal(saved().preferences.demo, false);
  assert.equal(screen.queryByText("Exploring sample nights"), null);
  cleanup();
  render(<App />);
  await u.click(screen.getByRole("button", { name: "Journal" }));
  await u.click(
    screen.getByText("A test night, only in the isolated test environment."),
  );
  await u.click(screen.getByRole("button", { name: /Bright/ }));
  fireEvent.change(screen.getByLabelText(/A thought from the night/), {
    target: { value: "Edited and saved." },
  });
  await u.click(screen.getByRole("button", { name: "Save changes" }));
  assert.equal(saved().entries[0].note, "Edited and saved.");
  assert.equal(saved().entries[0].quality, 5);
  await u.click(screen.getByRole("button", { name: "Log a night" }));
  await u.click(screen.getByRole("button", { name: "Save my night" }));
  assert.match(screen.getByRole("alert").textContent!, /already have a night/);
  assert.equal(saved().entries.length, 1);
});

test("deleting a night requires an explicit second click and returns to the empty journal", async () => {
  render(<App />);
  const u = await logNight();
  await u.click(screen.getByRole("button", { name: "View latest night" }));
  await u.click(screen.getByRole("button", { name: "Delete this night" }));
  assert.equal(saved().entries.length, 1);
  await u.click(screen.getByRole("button", { name: "Keep night" }));
  assert.equal(saved().entries.length, 1);
  await u.click(screen.getByRole("button", { name: "Delete this night" }));
  await u.click(screen.getByRole("button", { name: "Delete night" }));
  assert.equal(saved().entries.length, 0);
  assert.ok(screen.getByRole("button", { name: "Log my first night" }));
});

test("sample toggle preserves personal data; preferences persist independently", async () => {
  render(<App />);
  const u = await logNight();
  await u.click(screen.getByRole("button", { name: "Open settings" }));
  fireEvent.change(screen.getByLabelText("What should we call you?"), {
    target: { value: "Moon" },
  });
  fireEvent.change(screen.getByRole("slider"), { target: { value: "8.5" } });
  await u.click(screen.getByRole("switch", { name: "Explore sample nights" }));
  assert.equal(saved().preferences.demo, true);
  assert.equal(saved().entries.length, 1);
  await u.click(screen.getByRole("button", { name: "Save preferences" }));
  assert.equal(saved().preferences.name, "Moon");
  assert.equal(saved().preferences.goal, 8.5);
  assert.equal(saved().entries.length, 1);
});

test("Today answers questions with chart cards and Discover retains the detective", async () => {
  enableSampleFixture();
  render(<App />);
  const u = user();
  assert.ok(screen.getByRole("heading", { name: "Ask Noctis" }));
  assert.ok(
    screen.getByRole("textbox", { name: "Ask about your sleep journal" }),
  );
  await u.click(screen.getByText("Suggested questions"));
  await u.click(screen.getByRole("button", { name: "How was my week?" }));
  assert.match(screen.getByRole("log").textContent!, /7 logged nights/);
  assert.ok(
    within(screen.getByRole("log")).getByRole("group", {
      name: "7-day sleep duration chart",
    }),
  );
  await u.type(
    screen.getByRole("textbox", { name: "Ask about your sleep journal" }),
    "Does late caffeine show a pattern?{Enter}",
  );
  assert.match(screen.getByRole("log").textContent!, /not evidence of cause/);
  assert.ok(
    screen.getByLabelText("Sleep duration comparison for Late caffeine"),
  );
  await u.click(screen.getByText("Earlier questions"));
  assert.ok(
    within(screen.getByText("Earlier questions").closest("details")!).getByRole(
      "group",
      { name: "7-day sleep duration chart" },
    ),
  );
  await u.click(screen.getByRole("button", { name: "Discover" }));
  assert.equal(screen.queryByText("Ask Noctis"), null);
  await u.click(screen.getByRole("button", { name: "Detective" }));
  assert.ok(screen.getAllByText("A possible pattern").length > 0);
});

test("Today plots this week before chat and opens older constellations separately", async () => {
  const { dateOffset, demoEntries, weekEnding } = await import("../src/domain");
  const currentWeek = weekEnding(today());
  const monday = dateOffset(currentWeek, -6);
  const lastSunday = dateOffset(currentWeek, -7);
  const earlierSunday = dateOffset(currentWeek, -14);
  const state = freshStore();
  const [template] = demoEntries(today());
  state.entries = [
    ...Array.from({ length: 7 }, (_, index) => ({
      ...template,
      date: dateOffset(lastSunday, -index),
      id: `last-${index}`,
    })),
    { ...template, id: "old", date: earlierSunday },
    { ...template, id: "new", date: monday },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render(<App />);
  const chart = screen.getByRole("group", {
    name: "7-day sleep duration chart",
  });
  const log = screen.getByRole("button", { name: "Log a night" });
  const ask = screen.getByRole("heading", { name: "Ask Noctis" });
  assert.ok(log.compareDocumentPosition(chart) & 4);
  assert.ok(chart.compareDocumentPosition(ask) & 4);
  assert.equal(chart.querySelectorAll(".sleep-line-bloom").length, 1);
  assert.equal(chart.querySelector(".sleep-line-goal"), null);
  assert.equal(chart.querySelectorAll(".sleep-line-stroke").length, 0);

  const u = user();
  await u.click(screen.getByRole("button", { name: "Past weeks" }));
  const history = within(screen.getByRole("dialog", { name: "Past weeks" }));
  assert.equal(
    (
      history.getByRole("combobox", {
        name: "Choose a week",
      }) as HTMLSelectElement
    ).value,
    lastSunday,
  );
  const oldChart = () =>
    history.getByRole("group", { name: "7-day sleep duration chart" });
  assert.equal(oldChart().querySelectorAll(".sleep-line-bloom").length, 7);
  assert.equal(oldChart().querySelector(".sleep-line-goal"), null);
  assert.equal(oldChart().querySelectorAll(".sleep-line-stroke").length, 6);
  await u.click(history.getByRole("button", { name: "Older week" }));
  assert.equal(oldChart().querySelectorAll(".sleep-line-star").length, 1);
  assert.equal(oldChart().querySelectorAll(".sleep-line-stroke").length, 0);
  await u.click(history.getByRole("button", { name: "Newer week" }));
  assert.equal(oldChart().querySelectorAll(".sleep-line-star").length, 7);
});

test("home opens wind-down; long sessions and the checklist survive navigation and reload", async () => {
  render(<App />);
  const u = user();
  await u.click(
    screen.getByRole("button", { name: "Open wind-down timer and checklist" }),
  );
  assert.ok(screen.getByRole("heading", { name: "Your wind-down checklist" }));
  await u.click(screen.getByText("Evening plan"));
  await u.click(screen.getByRole("button", { name: /Adjust my schedule/ }));
  fireEvent.change(screen.getByLabelText("Starts at"), {
    target: { value: "06:30" },
  });
  await u.click(screen.getByRole("button", { name: /Update tonight/ }));
  assert.equal(saved().preferences.eventTime, "06:30");
  assert.ok(screen.getByText("5:15 am"));
  await u.click(screen.getByRole("checkbox", { name: /Soften the room/ }));
  assert.deepEqual(saved().routine.completed, ["lights"]);
  await u.click(screen.getByRole("button", { name: "45 min" }));
  await u.click(screen.getByRole("button", { name: "Start wind-down" }));
  const deadline = saved().windDownTimer.endAt;
  assert.ok(deadline > Date.now() + 2600000);
  await u.click(screen.getByRole("button", { name: "Today" }));
  assert.match(
    screen.getByRole("button", { name: "Open wind-down timer and checklist" })
      .textContent!,
    /1 of 4 rituals complete/,
  );
  cleanup();
  render(<App />);
  assert.equal(saved().windDownTimer.endAt, deadline);
  await u.click(screen.getByRole("button", { name: "Wind down" }));
  await u.click(screen.getByRole("button", { name: "Pause wind-down" }));
  assert.equal(saved().windDownTimer.endAt, null);
  assert.ok(saved().windDownTimer.remaining > 0);
  assert.equal(saved().windDownTimer.duration, 2700);
  cleanup();
  render(<App />);
  await u.click(screen.getByRole("button", { name: "Wind down" }));
  await u.click(screen.getByRole("button", { name: "Reset wind-down timer" }));
  assert.equal(saved().windDownTimer.remaining, 2700);
  assert.equal(
    (
      screen.getByRole("checkbox", {
        name: /Soften the room/,
      }) as HTMLInputElement
    ).checked,
    true,
  );
});

test("wind-down edits save custom tasks, suggestions and progress without repopulating an empty list", async () => {
  const olderStore = freshStore();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...olderStore,
      routine: { date: today(), completed: ["lights", "phone"] },
    }),
  );
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Wind down" }));
  assert.equal(screen.getAllByRole("checkbox").length, 4);
  await u.click(screen.getByRole("button", { name: "Edit" }));
  await u.click(screen.getByRole("button", { name: "Remove Soften the room" }));
  await u.click(screen.getByRole("button", { name: "Read a few pages" }));
  await u.type(screen.getByLabelText("New task"), "  Pack my bag  ");
  await u.click(screen.getByRole("button", { name: "Save checklist" }));
  assert.deepEqual(saved().routine.completed, ["phone"]);
  assert.equal(
    screen.queryByRole("checkbox", { name: "Soften the room" }),
    null,
  );
  await u.click(screen.getByRole("checkbox", { name: "Pack my bag" }));
  cleanup();
  render(<App />);
  await u.click(screen.getByRole("button", { name: "Wind down" }));
  assert.ok(
    (screen.getByRole("checkbox", { name: "Pack my bag" }) as HTMLInputElement)
      .checked,
  );
  await u.click(screen.getByRole("button", { name: "Edit" }));
  await u.type(screen.getByLabelText("New task"), "read a few pages");
  await u.click(screen.getByRole("button", { name: "Add task" }));
  assert.match(screen.getByRole("alert").textContent!, /already in/);
  await u.clear(screen.getByLabelText("New task"));
  for (const button of screen.getAllByRole("button", { name: /^Remove / }))
    await u.click(button);
  await u.click(screen.getByRole("button", { name: "Save checklist" }));
  assert.deepEqual(saved().routine.tasks, []);
  assert.deepEqual(saved().routine.completed, []);
  cleanup();
  render(<App />);
  await u.click(screen.getByRole("button", { name: "Wind down" }));
  assert.ok(screen.getByRole("button", { name: "Add tasks" }));
  assert.equal(screen.queryByRole("progressbar"), null);
});

test("wind-down completion is handled on Today without opening its page", async () => {
  const state = freshStore();
  state.windDownTimer.endAt = Date.now() - 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render(<App />);
  await waitFor(() => assert.equal(saved().windDownTimer.remaining, 0));
  assert.equal(saved().windDownTimer.endAt, null);
  assert.match(
    screen.getByRole("status").textContent!,
    /wind-down timer is complete/,
  );
  const u = user();
  await u.click(
    screen.getByRole("button", { name: "Open wind-down timer and checklist" }),
  );
  assert.ok(screen.getByRole("button", { name: "Start again" }));
  assert.deepEqual(saved().routine.completed, []);
});

test("backup import previews replacement and restores only after confirmation", async () => {
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Open settings" }));
  const backup = freshStore();
  backup.entries = [
    {
      id: "restored",
      date: today(),
      bedtime: "23:30",
      wakeTime: "07:30",
      latency: 10,
      awake: 0,
      quality: 4,
      tags: ["Reading"],
      note: "From a backup.",
    },
  ];
  const file = { size: 500, text: async () => JSON.stringify(backup) };
  fireEvent.change(screen.getByLabelText("Import journal backup"), {
    target: { files: [file] },
  });
  await waitFor(() => assert.ok(screen.getByText("Restore 1 night?")));
  assert.equal(saved().entries.length, 0);
  await u.click(screen.getByRole("button", { name: "Replace & restore" }));
  assert.equal(saved().entries[0].id, "restored");
  assert.equal(saved().preferences.demo, false);
});

test("start-journal invitation stays on Today and opens a real entry before changing modes", async () => {
  enableSampleFixture();
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Journal" }));
  assert.equal(
    screen.queryByRole("button", { name: "Start my journal" }),
    null,
  );
  assert.ok(screen.getByText("Sample nights"));
  await u.click(screen.getByRole("button", { name: "Today" }));
  await u.click(screen.getByRole("button", { name: "Start my journal" }));
  assert.ok(screen.getByRole("dialog"));
  assert.equal(saved().preferences.demo, true);
  await u.click(screen.getByRole("button", { name: "Close dialog" }));
  assert.equal(saved().entries.length, 0);
  assert.equal(saved().preferences.demo, true);
  await u.click(screen.getByRole("button", { name: "Start my journal" }));
  await u.click(screen.getByRole("button", { name: "Save my night" }));
  assert.equal(saved().preferences.demo, false);
  await u.click(screen.getByRole("button", { name: "Journal" }));
  assert.ok(screen.getByText("1 night"));
  assert.equal(screen.queryByText("Sample nights"), null);
});

test("journal calendar starts a new entry on the chosen morning without navigating away", async () => {
  const { dateOffset, dateLabel } = await import("../src/domain");
  const state = freshStore();
  state.preferences.demo = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Journal" }));
  const date = dateOffset(today(), -3);
  await u.click(
    screen.getByRole("button", {
      name: `${dateLabel(date, { weekday: "long", month: "short", day: "numeric" })}: write a night`,
    }),
  );
  assert.equal(
    (screen.getByLabelText("Wake-up date") as HTMLInputElement).value,
    date,
  );
  await u.click(screen.getByRole("button", { name: "Save my night" }));
  assert.equal(saved().entries[0].date, date);
  assert.equal(
    document.querySelector<HTMLElement>(".dock-cursor")?.style.transform,
    "translateX(100%)",
  );
  assert.equal(
    screen
      .getByRole("button", { name: "Journal" })
      .getAttribute("aria-current"),
    "page",
  );
});

test("rapidly reopening a closing sheet resets an unsaved draft", async () => {
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Log my first night" }));
  fireEvent.change(screen.getByLabelText(/A thought from the night/), {
    target: { value: "Do not save this draft" },
  });
  await u.keyboard("{Escape}");
  await u.click(screen.getByRole("button", { name: "Log my first night" }));
  assert.equal(
    (screen.getByLabelText(/A thought from the night/) as HTMLTextAreaElement)
      .value,
    "",
  );
  assert.equal(saved().entries.length, 0);
});

test("rapid navigation cancels old transitions and the latest destination wins", async () => {
  const { changePage } = await import("../src/motion");
  const callbacks: (() => void)[] = [];
  const updates: string[] = [];
  let skipped = 0;
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: (update: () => void) => {
      callbacks.push(update);
      return {
        skipTransition: () => {
          skipped++;
        },
        ready: Promise.resolve(),
        finished: new Promise<void>(() => {}),
      };
    },
  });
  try {
    changePage(() => updates.push("Journal"));
    changePage(() => updates.push("Tonight"));
    callbacks[0]();
    callbacks[1]();
    assert.deepEqual(updates, ["Tonight"]);
    assert.equal(skipped, 1);
  } finally {
    Reflect.deleteProperty(document, "startViewTransition");
  }
});

test("reduced motion navigates immediately and does not start spatial transitions", async () => {
  const { changePage } = await import("../src/motion");
  let called = 0;
  let updated = false;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: true }),
  });
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: () => {
      called++;
    },
  });
  try {
    changePage(() => {
      updated = true;
    });
    assert.equal(updated, true);
    assert.equal(called, 0);
  } finally {
    Reflect.deleteProperty(window, "matchMedia");
    Reflect.deleteProperty(document, "startViewTransition");
  }
});

test("an earlier journal can be adopted explicitly without appearing in a different account", async () => {
  const legacy = freshStore();
  legacy.preferences.name = "Earlier journal owner";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
  const { accountStorageKey } = await import("../src/storage");

  const firstKey = accountStorageKey("account-one");
  render(<App storageKey={firstKey} legacyStorageKey={STORAGE_KEY} />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Open settings" }));
  assert.equal(
    (screen.getByLabelText("What should we call you?") as HTMLInputElement)
      .value,
    "",
  );
  await u.click(
    screen.getByRole("button", { name: "Import journal from before sign-in" }),
  );
  await u.click(screen.getByRole("button", { name: "Replace & restore" }));
  assert.equal(
    JSON.parse(localStorage.getItem(firstKey)!).preferences.name,
    legacy.preferences.name,
  );
  assert.equal(saved().preferences.name, legacy.preferences.name);

  cleanup();
  render(
    <App
      storageKey={accountStorageKey("account-two")}
      legacyStorageKey={STORAGE_KEY}
    />,
  );
  await u.click(screen.getByRole("button", { name: "Open settings" }));
  assert.equal(
    (screen.getByLabelText("What should we call you?") as HTMLInputElement)
      .value,
    "",
  );
  assert.equal(
    screen.queryByRole("button", {
      name: "Import journal from before sign-in",
    }),
    null,
  );
});

test("a new signed-in account opens its empty personal journal", async () => {
  const { accountStorageKey } = await import("../src/storage");
  const key = accountStorageKey("new-account");
  render(
    <App
      storageKey={key}
      account={{ email: "new@example.test", signOut: async () => {} }}
    />,
  );
  assert.ok(screen.getByRole("button", { name: "Log my first night" }));
  assert.ok(screen.getByRole("group", { name: "7-day sleep duration chart" }));
  assert.ok(screen.getByText("Log a night to add your first star this week."));
  assert.equal(screen.queryByText("Exploring sample nights"), null);
  assert.equal(
    screen.queryByRole("button", { name: "View latest night" }),
    null,
  );
  const state = JSON.parse(localStorage.getItem(key)!);
  assert.deepEqual(state.entries, []);
  assert.equal(state.preferences.demo, false);
});
