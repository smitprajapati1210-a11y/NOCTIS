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
const { render, screen, cleanup, fireEvent, waitFor } =
  await import("@testing-library/react");
const { default: userEvent } = await import("@testing-library/user-event");
const { default: App } = await import("../src/App");
const { STORAGE_KEY, freshStore } = await import("../src/storage");
const { today } = await import("../src/domain");
const user = () => userEvent.setup({ document: dom.window.document });
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

async function logNight(
  note = "A test night, only in the isolated test environment.",
) {
  const u = user();
  await u.click(screen.getByRole("button", { name: /How did you sleep/ }));
  fireEvent.change(screen.getByLabelText(/A thought from the night/), {
    target: { value: note },
  });
  await u.click(screen.getByRole("button", { name: "Reading" }));
  await u.click(screen.getByRole("button", { name: "Save my night" }));
  return u;
}

test("saving a real night exits samples; edit survives a remount; duplicate date is blocked", async () => {
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

test("local chat renders computed chart cards and detective comparisons", async () => {
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Discover" }));
  await u.click(screen.getByRole("button", { name: "Detective" }));
  assert.ok(screen.getAllByText("A possible pattern").length > 0);
  await u.click(screen.getByRole("button", { name: "Ask Noctis" }));
  await u.click(screen.getByRole("button", { name: "How was my week?" }));
  assert.match(screen.getByRole("log").textContent!, /7 logged nights/);
  assert.ok(screen.getByRole("group", { name: "7-day sleep duration chart" }));
  await u.click(
    screen.getByRole("button", { name: "Does late caffeine show a pattern?" }),
  );
  assert.match(screen.getByRole("log").textContent!, /not evidence of cause/);
  assert.ok(
    screen.getByLabelText("Sleep duration comparison for Late caffeine"),
  );
});

test("planner saves constraints; timer can pause after changing views; rituals persist", async () => {
  render(<App />);
  const u = user();
  await u.click(screen.getByRole("button", { name: "Tonight" }));
  await u.click(screen.getByRole("button", { name: /Adjust my schedule/ }));
  fireEvent.change(screen.getByLabelText("Starts at"), {
    target: { value: "06:30" },
  });
  await u.click(screen.getByRole("button", { name: /Update tonight/ }));
  assert.equal(saved().preferences.eventTime, "06:30");
  assert.ok(screen.getByText("5:15 am"));
  await u.click(screen.getByRole("button", { name: /Soften the room/ }));
  assert.deepEqual(saved().routine.completed, ["lights"]);
  await u.click(screen.getByRole("button", { name: "Begin a pause" }));
  assert.ok(saved().timer.endAt > Date.now());
  await u.click(screen.getByRole("button", { name: "Today" }));
  await u.click(screen.getByRole("button", { name: "Tonight" }));
  await u.click(screen.getByRole("button", { name: "Pause" }));
  assert.equal(saved().timer.endAt, null);
  assert.ok(saved().timer.remaining > 0);
  assert.equal(
    screen
      .getByRole("button", { name: /Soften the room/ })
      .getAttribute("aria-pressed"),
    "true",
  );
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
  assert.ok(screen.getByText("1 personal"));
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
  assert.equal(document.querySelector<HTMLElement>(".dock-cursor")?.style.transform,"translateX(100%)");
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
  await u.click(screen.getByRole("button", { name: /How did you sleep/ }));
  fireEvent.change(screen.getByLabelText(/A thought from the night/), {
    target: { value: "Do not save this draft" },
  });
  await u.keyboard("{Escape}");
  await u.click(screen.getByRole("button", { name: /How did you sleep/ }));
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
