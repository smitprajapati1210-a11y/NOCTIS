import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  FlaskConical,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import {
  average,
  consistency,
  durationLabel,
  patterns,
  recent,
  replyTo,
  sleepMinutes,
  type ChatReply,
  type Entry,
} from "../domain";
import { PatternBars, SleepChart } from "./Charts";
import Segmented from "./Segmented";
import RestedChart from "./RestedChart";

export default function Discover({
  entries,
  goal,
  demo,
  initial = "overview",
}: {
  entries: Entry[];
  goal: number;
  demo: boolean;
  initial?: "overview" | "patterns" | "chat";
}) {
  const [tab, setTab] = useState(initial);
  const [hasInteracted, setHasInteracted] = useState(false);
  const selectTab = (next: typeof initial) => {
    if (next !== tab) {
      setHasInteracted(true);
      setTab(next);
    }
  };
  const week = recent(entries, 7);
  const month = recent(entries, 30);
  const comparisons = patterns(month);
  const ready = comparisons.filter((p) => p.ready);
  const regularity = consistency(week);
  return (
    <div className="view discover-view">
      <div className="page-intro lab-intro">
        <div className="lab-edition">
          <FlaskConical size={16} />
          <span>OBSERVE. REFLECT. REST.</span>
        </div>
        <h1>
          The Night <em>Lab.</em>
        </h1>
        <p className="muted">A little curiosity. A clearer picture.</p>
      </div>
      <Segmented
        options={[
          { value: "overview", label: "Insights" },
          { value: "patterns", label: "Detective" },
          { value: "chat", label: "Ask Noctis" },
        ]}
        value={tab}
        onChange={selectTab}
        label="Discovery view"
      />
      <div key={tab} className="discovery-content" data-animate={hasInteracted}>
        {tab === "overview" && (
          <>
            <section className="insight-feature lab-lead">
              <div className="lab-note-header">
                <span>FIELD NOTE / THIS WEEK</span>
                <span className="pill light">
                  {demo ? "Sample nights" : "Your journal"}
                </span>
              </div>
              <div className="lab-average">
                {week.length
                  ? durationLabel(average(week.map(sleepMinutes)))
                  : "—"}
                <span>your nightly average</span>
              </div>
              <h2>
                {week.length >= 3
                  ? "Your rhythm is taking shape."
                  : "A new story starts here."}
              </h2>
              <p>
                {week.length
                  ? `${week.length} logged nights. ${week.filter((e) => sleepMinutes(e) >= goal * 60).length} at your ${goal}-hour goal. A small record of how you rest.`
                  : "Log a night to start finding your rhythm. Missing mornings are never counted as zero sleep."}
              </p>
              <span className="lab-note-number" aria-hidden="true">
                01
              </span>
            </section>
            <div className="stats-pair">
              <div className="card mini-stat">
                <span>Rested, on average</span>
                <strong>
                  {week.length
                    ? average(week.map((e) => e.quality)).toFixed(1)
                    : "—"}
                  <small> / 5</small>
                </strong>
                <p>Your own morning rating</p>
              </div>
              <div className="card mini-stat">
                <span>Bedtime variation</span>
                <strong>
                  {regularity === null ? "—" : regularity}
                  <small>{regularity === null ? "" : " min"}</small>
                </strong>
                <p>
                  {regularity === null
                    ? "Needs 3 logged nights"
                    : "Standard deviation · 7 days"}
                </p>
              </div>
            </div>
            <section className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">NOTICING HOW YOU FEEL</p>
                  <h3>Your morning mood</h3>
                </div>
                <span className="icon-tile">
                  <ChartNoAxesCombined size={18} />
                </span>
              </div>
              <p className="muted small">
                Rested ratings over your last 7 mornings.
              </p>
              <RestedChart entries={entries} />
              <p className="caption">
                Self-reported, from 1 (drained) to 5 (bright).
              </p>
            </section>
            <button
              className="discovery-link"
              onClick={() => selectTab("patterns")}
            >
              <span className="icon-tile green">
                <FlaskConical size={21} />
              </span>
              <span>
                <strong>The pattern detective</strong>
                <small>
                  {ready.length
                    ? `${ready.length} habits ready to compare`
                    : "A few more nights, a little more clarity"}
                </small>
              </span>
              <ChevronRight size={19} />
            </button>
            <button className="ask-banner" onClick={() => selectTab("chat")}>
              <Sparkles size={24} />
              <span>
                <strong>Let’s reflect together.</strong>
                <small>Ask about your week or a habit.</small>
              </span>
              <ArrowUpRight size={22} />
            </button>
            <p className="caption centered">
              Local insight preview · No AI model connected
            </p>
          </>
        )}
        {tab === "patterns" && (
          <>
            <div className="detective-intro">
              <span className="icon-tile green">
                <FlaskConical size={22} />
              </span>
              <div>
                <h3>A clue, not a conclusion.</h3>
                <p>
                  Compare tagged and untagged nights from the past 30 days.
                  Other things may be at play.
                </p>
              </div>
            </div>
            {comparisons.map((p, index) => (
              <details
                className="card pattern-card"
                key={p.tag}
                open={index === 0 && p.ready}
              >
                <summary className="section-heading">
                  <h3>{p.tag}</h3>
                  <span className={`pill ${p.ready ? "sage" : "subtle"}`}>
                    {p.ready ? "A possible pattern" : "Gathering clues"}
                  </span>
                </summary>
                {p.ready ? (
                  <>
                    <p className="pattern-finding">
                      <strong>{Math.round(Math.abs(p.difference))} min</strong>{" "}
                      {p.difference >= 0 ? "more" : "less"} sleep on tagged
                      nights
                    </p>
                    <PatternBars pattern={p} />
                  </>
                ) : (
                  <>
                    <p className="muted small">
                      We need at least 3 nights in each group before making a
                      comparison.
                    </p>
                    <div className="sample-counts">
                      <span>{p.withCount}/3 tagged nights</span>
                      <span>{p.withoutCount}/3 untagged nights</span>
                    </div>
                  </>
                )}
                <p className="caption">
                  “Not tagged” may mean the habit wasn’t recorded. This
                  comparison cannot establish cause.
                </p>
              </details>
            ))}
          </>
        )}
        {tab === "chat" && <Chat entries={entries} goal={goal} demo={demo} />}
      </div>
    </div>
  );
}

type Message = { role: "user" | "assistant"; text: string; reply?: ChatReply };
function Chat({
  entries,
  goal,
  demo,
}: {
  entries: Entry[];
  goal: number;
  demo: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);
  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    const reply = replyTo(question, entries, goal);
    setMessages((s) => [
      ...s,
      { role: "user", text: question },
      { role: "assistant", text: reply.text, reply },
    ]);
    setInput("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }
  return (
    <div className="chat-view">
      <div className="assistant-notice">
        <Sparkles size={16} />
        <span>
          Local preview · {demo ? "Sample journal" : "Your journal"} · No AI
          connected
        </span>
      </div>
      <div className="chat-welcome">
        <div className="assistant-orb">
          <Sparkles size={28} strokeWidth={1.3} />
        </div>
        <h2>
          Let’s make sense
          <br />
          <em>of your nights.</em>
        </h2>
        <p>
          I can summarize your nights, draw a chart, and help you notice
          patterns.
        </p>
      </div>
      <div className="prompt-list">
        {[
          "How was my week?",
          "Show my rested ratings",
          "Does late caffeine show a pattern?",
        ].map((q) => (
          <button key={q} onClick={() => send(q)}>
            {q}
            <ArrowRight size={15} />
          </button>
        ))}
      </div>
      <div
        className="messages"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.map((m, i) => (
          <div className={`message ${m.role}`} key={i}>
            {m.role === "assistant" && (
              <span className="message-name">
                <Sparkles size={13} />
                NOCTIS PREVIEW
              </span>
            )}
            <p>{m.text}</p>
            {m.reply?.chart && (
              <div className="chat-chart-card">
                <div className="section-heading">
                  <strong>
                    {m.reply.chart === "pattern"
                      ? "A closer look"
                      : m.reply.chart === "quality"
                        ? "How your mornings felt"
                        : "Your last 7 nights"}
                  </strong>
                  <ChartNoAxesCombined size={17} />
                </div>
                {m.reply.chart === "pattern" ? (
                  (() => {
                    const p =
                      patterns(recent(entries, 30)).find(
                        (p) => p.tag === m.reply?.tag,
                      ) ?? patterns(recent(entries, 30)).find((p) => p.ready);
                    return p?.ready ? (
                      <>
                        <p className="caption">{p.tag} · Last 30 days</p>
                        <PatternBars pattern={p} />
                      </>
                    ) : (
                      <p className="caption">
                        Keep tagging your evenings. A comparison needs 3 nights
                        with a tag and 3 without it.
                      </p>
                    );
                  })()
                ) : (
                  <SleepChart
                    entries={entries}
                    goal={goal}
                    metric={m.reply.chart}
                    compact
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div ref={end} />
      <form className="chat-composer" onSubmit={submit}>
        <MessageCircle size={19} />
        <input
          aria-label="Ask about your sleep journal"
          placeholder="Ask about your nights…"
          maxLength={500}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!input.trim()}
        >
          <Send size={18} />
        </button>
      </form>
      <p className="caption centered">
        Responses use local rules and your journal calculations. Chat is cleared
        when you leave this view. For reflection, not diagnosis.
      </p>
    </div>
  );
}
