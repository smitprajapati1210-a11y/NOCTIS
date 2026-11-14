import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Clock3,
  House,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sunrise,
  X,
} from "lucide-react";
import {
  average,
  dateLabel,
  demoEntries,
  durationLabel,
  recent,
  sleepMinutes,
  sorted,
  timeLabel,
  today,
  type Entry,
  type Store,
} from "./domain";
import { readStore, STORAGE_KEY } from "./storage";
import { Heatmap, SleepChart, WeeklyAverage } from "./components/Charts";
import AskNoctis from "./components/AskNoctis";
import ChecklistEditor from "./components/ChecklistEditor";
import Discover from "./components/Discover";
import EntryForm from "./components/EntryForm";
import Modal from "./components/Modal";
import OverlayPresence from "./components/OverlayPresence";
import Segmented from "./components/Segmented";
import { changePage } from "./motion";
import Settings from "./components/Settings";
import Tonight from "./components/Tonight";
import NightMoon, { MoonVisual } from "./components/Moon";
import { entryMoment } from "./moon";
import LunarScene from "./components/LunarScene";
import WeekRail from "./components/WeekRail";
import AppHeader from "./components/AppHeader";
import { WindDownHome } from "./components/WindDown";
import { useWindDown } from "./useWindDown";

type Tab = "today" | "journal" | "discover" | "tonight";
const tabs = [
  { id: "today" as const, label: "Today", icon: House },
  { id: "journal" as const, label: "Journal", icon: BookOpen },
  { id: "discover" as const, label: "Discover", icon: Sparkles },
  { id: "tonight" as const, label: "Wind down", icon: Moon },
];

export default function App({
  storageKey = STORAGE_KEY,
  legacyStorageKey,
  account,
}: {
  storageKey?: string;
  legacyStorageKey?: string;
  account?: { email: string; signOut: () => Promise<void> };
} = {}) {
  const initial = useMemo(() => readStore(storageKey), [storageKey]);
  const [store, setStore] = useState<Store>(initial.store);
  const [readError, setReadError] = useState(initial.error);
  const [writeError, setWriteError] = useState("");
  const [tab, setTab] = useState<Tab>("today");
  const [modal, setModal] = useState<
    "entry" | "settings" | "sample" | "checklist" | null
  >(null);
  const [editing, setEditing] = useState<Entry | undefined>();
  const [entryDate, setEntryDate] = useState(today());
  const [toast, setToast] = useState("");
  const [chartDays, setChartDays] = useState(7);
  const [query, setQuery] = useState("");
  const [day, setDay] = useState(today());
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (readError) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(store));
      setWriteError("");
    } catch {
      setWriteError(
        "This browser could not save your latest changes. Export a backup before closing the app.",
      );
    }
  }, [store, readError, storageKey]);
  useEffect(() => {
    const visibility = () => {
      document.documentElement.dataset.pageHidden = String(document.hidden);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setDay(today()), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  const notify = useCallback((text: string) => setToast(text), []);
  const samples = useMemo(() => demoEntries(day), [day]);
  const demo = store.preferences.demo;
  const entries = demo ? samples : sorted(store.entries);
  const week = recent(entries, chartDays);
  const latest = sorted(entries)[0];
  const goal = store.preferences.goal;
  const avg = average(week.map(sleepMinutes));
  const windDown = useWindDown(store, setStore, notify);
  const newNight = () => {
    setEntryDate(day);
    setEditing(undefined);
    setModal("entry");
  };
  const newNightOn = (date: string) => {
    newNight();
    setEntryDate(date);
  };
  const openEntry = (e: Entry) => {
    setEditing(e);
    setModal(demo ? "sample" : "entry");
  };
  function navigate(next: Tab) {
    if (next === tab) return;
    const direction =
      tabs.findIndex((t) => t.id === next) >=
      tabs.findIndex((t) => t.id === tab)
        ? "forward"
        : "backward";
    changePage(() => {
      setTab(next);
      setQuery("");
      if (content.current) content.current.scrollTop = 0;
      content.current?.focus({ preventScroll: true });
    }, direction);
  }
  function saveEntry(e: Entry) {
    setStore((s) => ({
      ...s,
      entries: [...s.entries.filter((x) => x.id !== e.id), e],
      preferences: { ...s.preferences, demo: false },
    }));
    setModal(null);
    notify("Your night is saved. A little more understood.");
  }
  const filtered = entries.filter((e) =>
    `${e.note} ${e.tags.join(" ")} ${dateLabel(e.date)} ${e.date}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <AppHeader
        day={day}
        sample={demo && tab !== "today"}
        onHome={() => navigate("today")}
        onSettings={() => setModal("settings")}
      />
      {(readError || writeError) && (
        <div className="storage-alert" role="alert">
          <p>{readError || writeError}</p>
          <button onClick={() => setModal("settings")}>
            Open Settings
            <ChevronRight size={15} />
          </button>
        </div>
      )}
      <main
        ref={content}
        tabIndex={-1}
        id="main-content"
        className="route-stage"
      >
        {tab === "today" && (
          <div className="view today-view">
            {demo && (
              <div className="demo-banner">
                <span>
                  <i />
                  Exploring sample nights
                </span>
                <button
                  onClick={() => {
                    if (store.entries.length) {
                      setStore((s) => ({
                        ...s,
                        preferences: { ...s.preferences, demo: false },
                      }));
                      navigate("journal");
                    } else {
                      newNight();
                    }
                  }}
                >
                  {store.entries.length
                    ? "Open my journal"
                    : "Start my journal"}
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            <LunarScene day={day} name={store.preferences.name} />
            <AskNoctis
              key={String(demo)}
              entries={entries}
              goal={goal}
              demo={demo}
            />
            <section
              className="today-trends"
              aria-labelledby="today-trends-heading"
            >
              <div className="section-heading">
                <div className="today-average">
                  <h2 id="today-trends-heading">
                    <ChartNoAxesCombined size={16} aria-hidden="true" /> Your
                    sleep rhythm
                  </h2>
                  <small>
                    {week.length
                      ? `${durationLabel(avg)} average · ${week.length}/${chartDays} nights`
                      : `${chartDays === 7 ? "This week" : "Past 30 days"} · No nights logged`}
                  </small>
                </div>
                <Segmented
                  options={[
                    { value: 7, label: "Week" },
                    { value: 30, label: "Month" },
                  ]}
                  value={chartDays}
                  onChange={setChartDays}
                  label="Chart time period"
                  mini
                />
              </div>
              <SleepChart
                entries={entries}
                goal={goal}
                days={chartDays}
                onSelect={openEntry}
              />
            </section>
            <div className="today-actions" aria-label="Quick actions">
              <button className="today-log" onClick={newNight}>
                <Plus size={19} aria-hidden="true" />
                <strong>{latest ? "Log a night" : "Log my first night"}</strong>
              </button>
              <WindDownHome
                store={store}
                timer={windDown}
                day={day}
                onOpen={() => navigate("tonight")}
              />
            </div>
            {latest && (
              <button
                className="latest-night"
                aria-label="View latest night"
                onClick={() => openEntry(latest)}
              >
                <span>
                  <strong>{durationLabel(sleepMinutes(latest))}</strong>
                  <small>
                    Estimated sleep ·{" "}
                    {Math.round((sleepMinutes(latest) / (goal * 60)) * 100)}% of
                    goal
                  </small>
                </span>
                <span>
                  <small>
                    {latest.date === day
                      ? "Last night"
                      : dateLabel(latest.date)}
                  </small>
                  <ChevronRight size={17} aria-hidden="true" />
                </span>
              </button>
            )}
          </div>
        )}
        {tab === "journal" && (
          <div className="view journal-view">
            <div className="page-intro journal-intro">
              <h1 className="symbol-heading">
                <BookOpen aria-hidden="true" /> Journal
              </h1>
              <button className="primary" onClick={newNight}>
                <Plus size={17} aria-hidden="true" /> Log a night
              </button>
            </div>
            <WeekRail
              entries={entries}
              onSelect={openEntry}
              onWrite={newNightOn}
            />
            <details
              className="more-panel journal-tools"
              onToggle={(event) => {
                if (!event.currentTarget.open) setQuery("");
              }}
            >
              <summary>
                Search and monthly heatmap{" "}
                <ChevronRight size={16} aria-hidden="true" />
              </summary>
              <label className="search-field">
                <Search size={18} aria-hidden="true" />
                <input
                  aria-label="Search journal"
                  placeholder="Search dates, notes, or habits…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </label>
              <WeeklyAverage entries={entries} />
              <Heatmap entries={entries} goal={goal} onSelect={openEntry} />
            </details>
            <div className="section-heading journal-heading">
              <h2>Your nights</h2>
              <span className="caption">
                {filtered.length} {filtered.length === 1 ? "night" : "nights"}
              </span>
            </div>
            <div className="entry-list">
              {filtered.map((e) => (
                <button
                  className="entry-row"
                  key={e.id}
                  onClick={() => openEntry(e)}
                >
                  <span className="journal-date">
                    <b>{dateLabel(e.date, { day: "numeric" })}</b>
                    <small>{dateLabel(e.date, { month: "short" })}</small>
                  </span>
                  <span className="entry-content">
                    <span className="entry-title">
                      <strong>{dateLabel(e.date, { weekday: "long" })} </strong>
                      <b>{durationLabel(sleepMinutes(e))}</b>
                    </span>
                    <span className="entry-meta">
                      {timeLabel(e.bedtime)} — {timeLabel(e.wakeTime)}
                      <span>·</span>
                      {e.quality}/5 rested
                    </span>
                    {e.note && <span className="entry-note">{e.note}</span>}
                    <span className="entry-tags">
                      {e.tags.slice(0, 1).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                      {e.tags.length > 1 && <span>+{e.tags.length - 1}</span>}
                    </span>
                  </span>
                  <span className="entry-moon" aria-hidden="true">
                    <MoonVisual date={entryMoment(e)} size={30} />
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
              {!filtered.length && (
                <div className="empty-state">
                  <BookOpen size={32} strokeWidth={1.1} />
                  <h3>
                    {query
                      ? "No nights found."
                      : "Every story starts somewhere."}
                  </h3>
                  <p>
                    {query
                      ? "Try a different habit, date, or thought."
                      : "Log your first night. We’ll keep the little details here."}
                  </p>
                  {!query && (
                    <button className="primary" onClick={newNight}>
                      Log my first night
                      <Plus size={17} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "discover" && <Discover entries={entries} goal={goal} />}
        {tab === "tonight" && (
          <Tonight
            store={store}
            setStore={setStore}
            notify={notify}
            windDown={windDown}
            day={day}
            onEditChecklist={() => setModal("checklist")}
          />
        )}
      </main>
      <nav
        className="bottom-nav"
        aria-label="Main navigation"
        style={
          {
            "--selected-index": tabs.findIndex((t) => t.id === tab),
          } as CSSProperties
        }
      >
        <span
          className="dock-cursor"
          aria-hidden="true"
          style={{
            transform: `translateX(${tabs.findIndex((t) => t.id === tab) * 100}%)`,
          }}
        />
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <span>
              <Icon size={21} strokeWidth={tab === id ? 1.9 : 1.5} />
            </span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <OverlayPresence show={modal !== null}>
        {modal === "checklist" && (
          <Modal
            title="Edit wind-down checklist"
            onClose={() => setModal(null)}
          >
            <ChecklistEditor
              tasks={store.routine.tasks}
              onSave={(tasks) => {
                const ids = new Set(tasks.map(({ id }) => id));
                setStore((previous) => ({
                  ...previous,
                  routine: {
                    ...previous.routine,
                    tasks,
                    completed: previous.routine.completed.filter((id) =>
                      ids.has(id),
                    ),
                  },
                }));
                setModal(null);
              }}
            />
          </Modal>
        )}
        {modal === "entry" && (
          <Modal
            title={
              editing
                ? "A closer look at your night"
                : "Let’s remember your night"
            }
            onClose={() => setModal(null)}
          >
            <EntryForm
              entry={editing}
              initialDate={entryDate}
              entries={store.entries}
              onSave={saveEntry}
              onDelete={(e) => {
                setStore((s) => ({
                  ...s,
                  entries: s.entries.filter((x) => x.id !== e.id),
                }));
                setModal(null);
                notify("This night has been deleted.");
              }}
            />
          </Modal>
        )}
        {modal === "settings" && (
          <Modal title="Your space" onClose={() => setModal(null)}>
            <Settings
              storageKey={storageKey}
              legacyStorageKey={legacyStorageKey}
              account={account}
              store={store}
              setStore={setStore}
              storageError={readError || writeError}
              onRecover={() => {
                setReadError("");
                setWriteError("");
              }}
              notify={notify}
              onClose={() => setModal(null)}
            />
          </Modal>
        )}
        {modal === "sample" && editing && (
          <Modal title="A sample night" onClose={() => setModal(null)}>
            <div className="sample-detail">
              <span className="pill lavender">Sample data · Read only</span>
              <h2>
                {dateLabel(editing.date, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="sample-duration">
                {durationLabel(sleepMinutes(editing))}
              </div>
              <p className="muted">
                Estimated time asleep · {editing.quality}/5 rested
              </p>
              <div className="detail-times">
                <span>
                  <Moon size={17} />
                  {timeLabel(editing.bedtime)}
                </span>
                <ArrowRight size={16} />
                <span>
                  <Sunrise size={18} />
                  {timeLabel(editing.wakeTime)}
                </span>
              </div>
              <p className="caption">
                <Clock3 size={14} />
                {editing.latency}m to fall asleep · {editing.awake}m awake
                during night
              </p>
              <NightMoon date={entryMoment(editing)} compact />
              <p className="sample-note">“{editing.note}”</p>
              <div className="tag-list">
                {editing.tags.map((t) => (
                  <span className="tag selected" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <p className="muted small">
                This is an example of what your journal can hold. Your own
                entries stay separate.
              </p>
              <button className="primary full" onClick={newNight}>
                Log my own night
                <Plus size={17} />
              </button>
            </div>
          </Modal>
        )}
      </OverlayPresence>
      <button
        className="back-to-top"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  );
}
