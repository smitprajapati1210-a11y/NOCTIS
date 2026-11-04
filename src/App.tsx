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
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  House,
  Leaf,
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

export default function App() {
  const initial = useMemo(readStore, []);
  const [store, setStore] = useState<Store>(initial.store);
  const [readError, setReadError] = useState(initial.error);
  const [writeError, setWriteError] = useState("");
  const [tab, setTab] = useState<Tab>("today");
  const [discoveryTab, setDiscoveryTab] = useState<
    "overview" | "patterns" | "chat"
  >("overview");
  const [modal, setModal] = useState<"entry" | "settings" | "sample" | null>(
    null,
  );
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setWriteError("");
    } catch {
      setWriteError(
        "This browser could not save your latest changes. Export a backup before closing the app.",
      );
    }
  }, [store, readError]);
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
  function navigate(next: Tab, mode: typeof discoveryTab = "overview") {
    if (next === tab && mode === discoveryTab) return;
    const direction =
      tabs.findIndex((t) => t.id === next) >=
      tabs.findIndex((t) => t.id === tab)
        ? "forward"
        : "backward";
    changePage(() => {
      setTab(next);
      setDiscoveryTab(mode);
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
        name={store.preferences.name}
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

            <LunarScene
              name={store.preferences.name}
              onTonight={() => navigate("tonight")}
            />
            <WindDownHome
              store={store}
              timer={windDown}
              onOpen={() => navigate("tonight")}
            />
            {latest ? (
              <section className="sleep-hero" aria-label="Latest logged night">
                <div className="hero-stars" aria-hidden="true">
                  <span>✧</span>
                  <span>·</span>
                  <span>✦</span>
                  <span>·</span>
                  <span>+</span>
                </div>
                <div className="hero-top">
                  <span className="mini-label">
                    <Moon size={13} />
                    {latest.date === day ? "LAST NIGHT" : "LATEST NIGHT"}
                  </span>
                  <span className="hero-date">{dateLabel(latest.date)}</span>
                </div>
                <div className="hero-main">
                  <div>
                    <div className="sleep-number">
                      {Math.floor(sleepMinutes(latest) / 60)}
                      <span>h</span> {sleepMinutes(latest) % 60}
                      <span>m</span>
                    </div>
                    <p>Estimated time asleep</p>
                    <span className="rested-chip">
                      <Leaf size={12} />
                      {
                        [
                          "",
                          "Feeling drained",
                          "A little low",
                          "Feeling okay",
                          "Feeling rested",
                          "Feeling bright",
                        ][latest.quality]
                      }
                    </span>
                  </div>
                  <div
                    className="goal-dial"
                    aria-label={`${Math.round((sleepMinutes(latest) / (goal * 60)) * 100)}% of your ${goal}-hour goal`}
                  >
                    <svg viewBox="0 0 92 92" aria-hidden="true">
                      <circle cx="46" cy="46" r="38" />
                      <circle
                        className="goal-dial-fill"
                        cx="46"
                        cy="46"
                        r="38"
                        style={{
                          strokeDasharray: 239,
                          strokeDashoffset:
                            239 *
                            (1 -
                              Math.min(sleepMinutes(latest) / (goal * 60), 1)),
                        }}
                      />
                    </svg>
                    <span>
                      <strong>
                        {Math.round((sleepMinutes(latest) / (goal * 60)) * 100)}
                        <small>%</small>
                      </strong>
                      <em>of {goal}h goal</em>
                    </span>
                  </div>
                </div>
                <div className="hero-divider" />
                <div className="hero-bottom">
                  <div>
                    <Moon size={15} />
                    <span>
                      Bedtime<strong>{timeLabel(latest.bedtime)}</strong>
                    </span>
                  </div>
                  <div>
                    <Sunrise size={17} />
                    <span>
                      Wake-up<strong>{timeLabel(latest.wakeTime)}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => openEntry(latest)}
                    aria-label="View latest night"
                  >
                    <ArrowUpRight size={22} />
                  </button>
                </div>
              </section>
            ) : (
              <section className="sleep-hero empty-hero">
                <div className="empty-moon">
                  <Moon size={42} strokeWidth={1.1} />
                  <span>✧</span>
                </div>
                <h2>
                  A new page.
                  <br />A fresh perspective.
                </h2>
                <p>Your first night is the start of your story.</p>
                <button className="light-button" onClick={newNight}>
                  Log my first night
                  <ArrowRight size={17} />
                </button>
              </section>
            )}
            <button className="log-night-button" onClick={newNight}>
              <span className="plus-circle">
                <Plus size={20} />
              </span>
              <span>
                <strong>How did you sleep?</strong>
                <small>A minute to reflect on your night.</small>
              </span>
              <ChevronRight size={20} />
            </button>
            <section className="card weekly-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">FINDING YOUR RHYTHM</p>
                  <h3>Your sleep rhythm</h3>
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
              <div className="weekly-summary">
                <div>
                  <strong>{week.length ? durationLabel(avg) : "—"}</strong>
                  <span>nightly average</span>
                </div>
                <span className="nights-count">
                  {week.length}/{chartDays} nights logged
                </span>
              </div>
              <SleepChart
                entries={entries}
                goal={goal}
                days={chartDays}
                onSelect={openEntry}
              />
            </section>
            <button
              className="insight-teaser"
              onClick={() => navigate("discover")}
            >
              <span className="insight-spark">
                <Sparkles size={21} />
              </span>
              <span>
                <small>A LITTLE NIGHTLIGHT</small>
                <strong>
                  {entries.length
                    ? "What are your nights telling you?"
                    : "Your story starts with one night."}
                </strong>
                <p>
                  {entries.length
                    ? "Explore the patterns behind your rest."
                    : "Log your night to start connecting the dots."}
                </p>
              </span>
              <ArrowUpRight size={20} />
            </button>

            <p className="closing-caption">
              One night at a time. You’re finding your rhythm.
            </p>
          </div>
        )}
        {tab === "journal" && (
          <div className="view journal-view">
            <div className="page-intro journal-intro">
              <div className="journal-edition">
                <BookOpen size={16} />
                <span>THE PERSONAL EDITION</span>
              </div>
              <h1>
                Night <em>notes.</em>
              </h1>
              <p className="muted">Some nights are worth remembering.</p>
            </div>
            <WeekRail
              entries={entries}
              onSelect={openEntry}
              onWrite={newNightOn}
            />
            <div className="journal-summary">
              <div>
                <WeeklyAverage entries={entries} />
              </div>
              <button className="primary" onClick={newNight}>
                <Plus size={17} />
                Log a night
              </button>
            </div>
            <details className="heat-disclosure">
              <summary>
                Your month at a glance <ChevronRight size={17} />
              </summary>
              <Heatmap entries={entries} goal={goal} onSelect={openEntry} />
            </details>
            <div className="section-heading journal-heading">
              <h3>Your nights</h3>
              <span className="pill subtle">
                {entries.length} {demo ? "sample" : "personal"}
              </span>
            </div>
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search journal"
                placeholder="Search thoughts, dates, habits…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={15} />
                </button>
              )}
            </label>
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
                      {e.tags.slice(0, 2).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                      {e.tags.length > 2 && <span>+{e.tags.length - 2}</span>}
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
        {tab === "discover" && (
          <Discover
            key={`${demo}-${discoveryTab}`}
            entries={entries}
            goal={goal}
            demo={demo}
            initial={discoveryTab}
          />
        )}
        {tab === "tonight" && (
          <Tonight
            store={store}
            setStore={setStore}
            notify={notify}
            windDown={windDown}
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
