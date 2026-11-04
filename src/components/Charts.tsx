import { useState } from "react";
import {
  average,
  chartDays,
  dateLabel,
  durationLabel,
  recent,
  sleepMinutes,
  today,
  type Entry,
  type Pattern,
} from "../domain";

export function SleepChart({
  entries,
  goal,
  days = 7,
  metric = "duration",
  onSelect,
  compact = false,
}: {
  entries: Entry[];
  goal: number;
  days?: number;
  metric?: "duration" | "quality";
  onSelect?: (e: Entry) => void;
  compact?: boolean;
}) {
  const slots = chartDays(entries, days);
  const max =
    metric === "quality"
      ? 5
      : Math.ceil(
          Math.max(10, goal, ...entries.map((e) => sleepMinutes(e) / 60)),
        );
  const [selected, setSelected] = useState<Entry | null>(null);
  return (
    <div className={`chart ${compact ? "compact" : ""}`}>
      <div
        className="chart-area"
        role="group"
        aria-label={`${days}-day ${metric === "quality" ? "rested rating" : "sleep duration"} chart`}
      >
        <div className="chart-grid">
          <span>{metric === "quality" ? "5" : `${Math.ceil(max)}h`}</span>
          <span>{metric === "quality" ? "2.5" : `${max / 2}h`}</span>
          <span>0</span>
        </div>
        {metric === "duration" && (
          <div
            className="goal-line"
            style={{ bottom: `${(goal / max) * 100}%` }}
          >
            <span>{goal}h goal</span>
          </div>
        )}
        <div className={`bars ${days > 7 ? "dense" : ""}`}>
          {slots.map(({ date, entry }, i) => {
            const value = entry
              ? metric === "quality"
                ? entry.quality
                : sleepMinutes(entry) / 60
              : 0;
            const desc = `${dateLabel(date)}: ${entry ? (metric === "quality" ? `${value} out of 5 rested` : durationLabel(sleepMinutes(entry))) : "not logged"}`;
            return (
              <div key={date} className="bar-slot">
                {days === 7 ? (
                  <button
                    type="button"
                    className="chart-target"
                    aria-label={desc}
                    title={desc}
                    disabled={!entry}
                    onClick={() => {
                      if (entry) {
                        setSelected(entry);
                        onSelect?.(entry);
                      }
                    }}
                  >
                    <span
                      className={`bar ${entry ? (value >= (metric === "quality" ? 4 : goal) ? "met" : "") : "missing"} ${selected?.id === entry?.id && entry ? "selected" : ""}`}
                      style={{
                        height: `${entry ? Math.max((value / max) * 100, 3) : 3}%`,
                      }}
                    />
                  </button>
                ) : (
                  <span
                    aria-hidden="true"
                    className={`bar ${entry ? (value >= goal ? "met" : "") : "missing"}`}
                    style={{
                      height: `${entry ? Math.max((value / max) * 100, 3) : 3}%`,
                    }}
                  />
                )}
                <span className="bar-label">
                  {days === 7
                    ? dateLabel(date, { weekday: "narrow" })
                    : i % 5 === 0 || i === days - 1
                      ? dateLabel(date, { day: "numeric" })
                      : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {!compact && (
        <div className="chart-foot">
          <span>
            <i className="legend-dot" /> At or above goal
          </span>
          <span>
            {days === 7 ? "Tap a night to explore" : "Select a night below"}
          </span>
        </div>
      )}
      {compact && selected && (
        <p className="caption">
          {dateLabel(selected.date)} ·{" "}
          {metric === "quality"
            ? `${selected.quality}/5 rested`
            : durationLabel(sleepMinutes(selected))}
        </p>
      )}
      {!compact && (
        <details className="chart-data">
          <summary>View night-by-night data</summary>
          <div className="chart-data-list">
            {slots
              .filter((s) => s.entry)
              .map(({ date, entry }) => (
                <button key={date} onClick={() => entry && onSelect?.(entry)}>
                  <span>
                    {dateLabel(date, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <strong>{entry && durationLabel(sleepMinutes(entry))}</strong>
                </button>
              ))}
            {!slots.some((s) => s.entry) && (
              <p>No nights logged in this period yet.</p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export function Heatmap({
  entries,
  goal,
  onSelect,
}: {
  entries: Entry[];
  goal: number;
  onSelect: (e: Entry) => void;
}) {
  const slots = chartDays(entries, 35);
  const [empty, setEmpty] = useState("");
  return (
    <section className="card heat-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE BIGGER PICTURE</p>
          <h3>Your night garden</h3>
        </div>
        <span className="pill subtle">35 days</span>
      </div>
      <p className="muted small">
        Each square is a morning. Let the little habits grow.
      </p>
      <div className="heat-labels">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="heatmap" role="group" aria-label="35-day sleep heatmap">
        {Array.from(
          { length: (new Date(`${slots[0].date}T12:00:00`).getDay() + 6) % 7 },
          (_, i) => (
            <span key={`pad-${i}`} />
          ),
        )}
        {slots.map(({ date, entry }) => (
          <button
            key={date}
            title={`${dateLabel(date)}: ${entry ? durationLabel(sleepMinutes(entry)) : "not logged"}`}
            aria-label={`${dateLabel(date)}: ${entry ? durationLabel(sleepMinutes(entry)) : "not logged"}`}
            className={`heat-cell ${entry ? (sleepMinutes(entry) >= goal * 60 ? "level-3" : sleepMinutes(entry) >= goal * 45 ? "level-2" : "level-1") : ""} ${date === today() ? "is-today" : ""}`}
            onClick={() =>
              entry
                ? onSelect(entry)
                : setEmpty(`${dateLabel(date)} hasn’t been logged yet.`)
            }
          />
        ))}
      </div>
      {empty && (
        <p className="caption" role="status">
          {empty}
        </p>
      )}
      <div className="heat-legend">
        <span>
          {dateLabel(slots[0].date)} — {dateLabel(today())}
        </span>
        <div>
          <span>Less</span>
          <i />
          <i />
          <i />
          <i />
          <span>More sleep</span>
        </div>
      </div>
    </section>
  );
}

export function PatternBars({ pattern }: { pattern: Pattern }) {
  const max = Math.max(pattern.withMean, pattern.withoutMean, 1);
  return (
    <div
      className="comparison"
      aria-label={`Sleep duration comparison for ${pattern.tag}`}
    >
      {[
        {
          label: `Tagged · ${pattern.withCount} nights`,
          value: pattern.withMean,
          cls: "lavender",
        },
        {
          label: `Not tagged · ${pattern.withoutCount} nights`,
          value: pattern.withoutMean,
          cls: "green",
        },
      ].map((row) => (
        <div key={row.cls}>
          <div className="comparison-label">
            <span>{row.label}</span>
            <strong>{durationLabel(row.value)}</strong>
          </div>
          <div className="comparison-track">
            <div
              className={row.cls}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeeklyAverage({
  entries,
  days = 7,
}: {
  entries: Entry[];
  days?: number;
}) {
  const data = recent(entries, days);
  return (
    <>
      <strong>
        {data.length ? durationLabel(average(data.map(sleepMinutes))) : "—"}
      </strong>
      <span>
        {data.length} of {days} nights logged
      </span>
    </>
  );
}
