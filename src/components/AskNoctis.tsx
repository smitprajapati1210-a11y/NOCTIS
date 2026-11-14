import { useId, useRef, useState, type FormEvent } from "react";
import { ArrowUp, ChevronRight, Sparkles } from "lucide-react";
import {
  patterns,
  recent,
  replyTo,
  type ChatReply,
  type Entry,
} from "../domain";
import { PatternBars, SleepChart } from "./Charts";

type Exchange = {
  question: string;
  reply: ChatReply;
  entries: Entry[];
  goal: number;
};
const prompts = [
  "How was my week?",
  "Show my rested ratings",
  "Does late caffeine show a pattern?",
];

export default function AskNoctis({
  entries,
  goal,
  demo,
}: {
  entries: Entry[];
  goal: number;
  demo: boolean;
}) {
  const title = useId();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [input, setInput] = useState("");
  const [examples, setExamples] = useState(false);
  const exampleToggle = useRef<HTMLElement>(null);
  const latest = exchanges.at(-1);

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    const reply = replyTo(question, entries, goal);
    setExchanges((previous) => [
      ...previous,
      { question, reply, entries, goal },
    ]);
    setInput("");
    setExamples(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  return (
    <section className="ask-home" aria-labelledby={title}>
      <div className="ask-home-heading">
        <Sparkles size={20} aria-hidden="true" />
        <h2 id={title}>Ask Noctis</h2>
        <span>{demo ? "Sample journal" : "Journal assistant"}</span>
      </div>
      <form className="ask-home-form" onSubmit={submit}>
        <input
          aria-label="Ask about your sleep journal"
          placeholder="Ask about your sleep…"
          maxLength={500}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!input.trim()}
        >
          <ArrowUp size={19} aria-hidden="true" />
        </button>
      </form>
      <div
        role="log"
        aria-label="Conversation"
        aria-atomic="true"
        className="ask-home-answer"
      >
        {latest && <Answer key={exchanges.length} exchange={latest} />}
      </div>
      {exchanges.length > 1 && (
        <details className="more-panel ask-history">
          <summary>
            Earlier questions <ChevronRight size={16} aria-hidden="true" />
          </summary>
          {exchanges.slice(0, -1).map((exchange, index) => (
            <Answer key={index} exchange={exchange} />
          ))}
        </details>
      )}
      <details
        className="more-panel ask-examples"
        open={examples}
        onToggle={(event) => setExamples(event.currentTarget.open)}
      >
        <summary ref={exampleToggle}>
          Suggested questions <ChevronRight size={16} aria-hidden="true" />
        </summary>
        <div className="ask-suggestions">
          {prompts.map((question) => (
            <button
              key={question}
              onClick={() => {
                exampleToggle.current?.focus({ preventScroll: true });
                send(question);
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </details>
      <p className="ask-home-note">
        Local preview · Answers use your journal and built-in rules.
      </p>
    </section>
  );
}

function Answer({
  exchange: { question, reply, entries, goal },
}: {
  exchange: Exchange;
}) {
  const pattern =
    reply.chart === "pattern" && reply.tag
      ? patterns(recent(entries, 30)).find((item) => item.tag === reply.tag)
      : undefined;
  return (
    <article className="ask-answer">
      <h3>{question}</h3>
      <p>{reply.text}</p>
      {pattern?.ready && (
        <div className="ask-chart">
          <h4>{pattern.tag} · Past 30 days</h4>
          <PatternBars pattern={pattern} />
        </div>
      )}
      {(reply.chart === "duration" || reply.chart === "quality") && (
        <div className="ask-chart">
          <h4>
            {reply.chart === "quality" ? "Rested ratings" : "Sleep duration"} ·
            Past 7 days
          </h4>
          <SleepChart
            entries={entries}
            goal={goal}
            metric={reply.chart}
            compact
          />
        </div>
      )}
    </article>
  );
}
