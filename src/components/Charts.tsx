import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  weekEnd,
}: {
  entries: Entry[];
  goal: number;
  days?: number;
  metric?: "duration" | "quality";
  onSelect?: (e: Entry) => void;
  compact?: boolean;
  weekEnd?: string;
}) {
  const slots = chartDays(entries, days, weekEnd);
  const valueOf = (entry: Entry) =>
    metric === "quality" ? entry.quality : sleepMinutes(entry) / 60;
  const max =
    metric === "quality"
      ? 5
      : Math.ceil(
          Math.max(
            10,
            goal,
            ...slots.flatMap(({ entry }) => (entry ? [valueOf(entry)] : [])),
          ),
        );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (
      !weekEnd ||
      !canvas.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, [weekEnd]);
  const selected = slots.find(({ entry }) => entry?.id === selectedId)?.entry;
  const x = (i: number) => ((i + 0.5) / days) * 100;
  const y = (value: number) => 6 + (1 - value / max) * 88;
  const valueLabel = (entry: Entry) =>
    metric === "quality"
      ? `${entry.quality}/5 rested`
      : durationLabel(sleepMinutes(entry));

  const points = slots.flatMap(({ entry }, slot) =>
    entry ? [{ slot, x: x(slot), y: y(valueOf(entry)) }] : [],
  );
  const pointOrder = new Map(points.map(({ slot }, index) => [slot, index]));
  // Missing nights break the line, including in the weekly constellation.
  const edges = points.flatMap((point, index) => {
    const previous = points[index - 1];
    return previous?.slot === point.slot - 1
      ? [
          {
            slot: point.slot,
            path: `M ${previous.x} ${previous.y} L ${point.x} ${point.y}`,
          },
        ]
      : [];
  });
  const strokes = edges.map(({ slot, path }) => (
    <path
      key={slot}
      d={path}
      className="sleep-line-stroke"
      vectorEffect="non-scaling-stroke"
    />
  ));
  const first = points[0];
  const last = points.at(-1);

  return (
    <div
      className={`chart sleep-line-chart${weekEnd ? " sleep-constellation" : ""}${compact ? " compact" : ""}`}
    >
      <div
        className="sleep-line-plot"
        role="group"
        aria-label={`${days}-day ${metric === "quality" ? "rested rating" : "sleep duration"} chart`}
      >
        <div
          className="sleep-line-canvas"
          ref={canvas}
          data-in-view={inView ? "true" : undefined}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {[6, 50, 94].map((pos) => (
              <line
                key={pos}
                x1="0"
                x2="100"
                y1={pos}
                y2={pos}
                className="sleep-line-guide"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {metric === "duration" && !weekEnd && (
              <line
                x1="0"
                x2="100"
                y1={y(goal)}
                y2={y(goal)}
                className="sleep-line-goal"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {!weekEnd && strokes}
          </svg>
          {weekEnd && edges.length > 0 && first && last && (
            <svg
              key={points.map(({ slot }) => slot).join(",")}
              className="sleep-constellation-lines"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={
                {
                  "--star-count": points.length,
                  "--line-start": `${100 - first.x}%`,
                  "--line-end": `${99 - last.x}%`,
                  "--line-duration": `${(last.slot - first.slot) * 105}ms`,
                } as CSSProperties
              }
            >
              {strokes}
            </svg>
          )}
          {[max, max / 2, 0].map((value) => (
            <span
              key={value}
              className="sleep-line-value"
              aria-hidden="true"
              style={{ top: `${y(value)}%` }}
            >
              {value}
              {metric === "duration" && value !== 0 ? "h" : ""}
            </span>
          ))}
          {slots.map(({ date, entry }, i) => {
            const desc = `${dateLabel(date)}: ${entry ? (metric === "quality" ? `${entry.quality} out of 5 rested` : valueLabel(entry)) : "not logged"}`;
            return days === 7 ? (
              <button
                key={date}
                type="button"
                className="sleep-line-target"
                style={{
                  left: `${(i / days) * 100}%`,
                  width: `${100 / days}%`,
                }}
                aria-label={desc}
                title={desc}
                disabled={!entry}
                aria-pressed={entry ? selectedId === entry.id : undefined}
                onClick={() => {
                  if (entry) {
                    setSelectedId(entry.id);
                    onSelect?.(entry);
                  }
                }}
              >
                {entry && (
                  <span
                    className={
                      weekEnd
                        ? "sleep-line-dot sleep-line-star"
                        : "sleep-line-dot"
                    }
                    style={{ top: `${y(valueOf(entry))}%` }}
                  >
                    {weekEnd && (
                      <span
                        aria-hidden="true"
                        className="sleep-line-bloom"
                        style={
                          {
                            "--star-order": pointOrder.get(i),
                            "--twinkle-cycle": `${4800 + i * 370}ms`,
                            "--twinkle-delay": `${1550 + i * 330}ms`,
                          } as CSSProperties
                        }
                      >
                        <span className="sleep-line-light" />
                      </span>
                    )}
                  </span>
                )}
              </button>
            ) : entry ? (
              <span
                key={date}
                aria-hidden="true"
                className="sleep-line-dot dense"
                style={{ left: `${x(i)}%`, top: `${y(valueOf(entry))}%` }}
              />
            ) : null;
          })}
          {!points.length && (
            <p className="sleep-line-empty">
              {weekEnd
                ? "Log a night to add your first star this week."
                : "Your first night will start the line."}
            </p>
          )}
        </div>
        <div
          className="sleep-line-axis"
          aria-hidden="true"
          style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}
        >
          {slots.map(({ date }, i) => (
            <span key={date}>
              {days === 7
                ? dateLabel(date, { weekday: weekEnd ? "short" : "narrow" })
                : i === days - 1 || (i % 7 === 0 && i < days - 3)
                  ? dateLabel(date, { day: "numeric" })
                  : ""}
            </span>
          ))}
        </div>
      </div>
      {!compact && (points.length > 0 || !weekEnd) && (
        <div className="chart-foot">
          {!weekEnd && (
            <span>
              {metric === "duration" ? (
                <>
                  <i className="sleep-line-goal-key" aria-hidden="true" />{" "}
                  {goal}h goal
                </>
              ) : (
                "Self-reported · 1–5"
              )}
            </span>
          )}
          {!!points.length && (
            <span>
              {days === 7
                ? weekEnd
                  ? "Tap a star for details"
                  : "Tap a point to explore"
                : "Select a night below"}
            </span>
          )}
        </div>
      )}
      {(compact || !onSelect) && selected && (
        <p className="sleep-line-selection" role="status">
          {dateLabel(selected.date)} · {valueLabel(selected)}
        </p>
      )}
      {!compact && (
        <details className="chart-data">
          <summary>View night-by-night data</summary>
          <div className="chart-data-list">
            {slots
              .filter((s) => s.entry)
              .map(({ date, entry }) => {
                const label = (
                  <>
                    <span>
                      {dateLabel(date, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <strong>{entry && valueLabel(entry)}</strong>
                  </>
                );
                return onSelect ? (
                  <button key={date} onClick={() => entry && onSelect(entry)}>
                    {label}
                  </button>
                ) : (
                  <p className="chart-data-row" key={date}>
                    {label}
                  </p>
                );
              })}
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
